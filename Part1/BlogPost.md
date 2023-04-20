# How to integrate Vite 4 with ASP.NET Core Part 1

## Why Vite?

Webpack was the standard for our project but when we were upgrading a project from .NET Framework to .Net 6 and saw huge improvement in the development experience we also wanted that for our frontend.

In come Vite. Vite is an opinionated “bundler” that with minimal configuration you can get up and running. No more complex webpack config files. If you want Sass and Typescript do a npm install sass and typescript and it’s now automagically handling both .scss and .ts files, want react or vue there is a plugin for that.
Vite is really really fast, for us startup takes about 300ms and hot module reload feels instantaneously. Vite during development does not bundle anything, it uses [native ES modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) in the browser instead and for transforming it uses [esbuild](https://esbuild.github.io/) that is written in Go and is about 10-100x faster than other JavaScript-based bundlers.

## Setup Devlopment

To get a standard ASP.NET Core project I run:

``` csharp
dotnet new razor 
```

To setup vite I run:

``` typescript
npm create vite@latest Frontend -- --template vanilla-ts
```

Now it created basic vite project.

Next steps:

* Go to /Frontend/ and run:

    ``` typescript
    npm install
    ```

* Create vite.config.ts  inside the newly created Frontend folder.

    ``` typescript
    import { defineConfig } from "vite";
    import path from "path";
    
    // https://vitejs.dev/config/
    export default defineConfig({
      css: {
        devSourcemap: true,
      },
      server: {
        hmr: {
          protocol: "ws",
        },
      },
      build: {
        rollupOptions: {
          input: path.join(__dirname, "src", "main.ts"),
        },
      },
    });
    ```

* Move vite.svg from the public folder to the src folder.
* Add to the top of Frontend/src/main.ts:

    ``` typescript
    import viteLogo from "./vite.svg";
    ```

    Change:

    ``` typescript
    <img src="/vite.svg" class="logo" alt="Vite logo" />
    ```

    To:

    ``` typescript
    <img src="${viteLogo}" class="logo" alt="Vite logo" />
    ```

* I then add `<div id="app"></div>` to /Pages/Shared/_Layout.cshtml

    ``` typescript
    <div class="container">
        <main role="main" class="pb-3">
            @RenderBody()

            <div id="app"></div>
        </main>
    </div>
    ```

* I then delete the public folder, index.html and .gitignore since this will come from the ASP.NET Core

To make Vite handle able to handle file request from the frontend and hot module reload we need to forward all the request to the Vite development server.

Install Microsoft.AspNetCore.SpaServices.Extensions

``` csharp
dotnet add package Microsoft.AspNetCore.SpaServices.Extensions
```

Change:

``` csharp
app.MapRazorPages();
```

To:

``` csharp
app.UseEndpoints(endpoints =>
{
    endpoints.MapRazorPages();
});

if (app.Environment.IsDevelopment())
{
    app.UseSpa(spa =>
    {
        spa.UseProxyToSpaDevelopmentServer("http://localhost:5173/");
    });
}
```

Why add UseEndpoints? It's because of middleware, forsome reason app.MapRazorPages don't handle the request when we use app.UseSpa even thou app.UseSpa is after. But using endpoints fixes the problem and all routes that ASP.NET Core can't handle get proxied to Vite.

Finally the last thing is to add vite script and our entry point to /Pages/Shared/_Layout.cshtml, add this inside the head tag.

``` typescript
<environment names="Development">
    <script type="module" src="http://localhost:5173/@@vite/client"></script>
    <script type="module" defer src="http://localhost:5173/src/main.ts"></script>
</environment>
```

Why /src/main.ts it because it is the path that Vite gets and /src/main.ts is the relative path from the frontend directory that is the root for vite. If you would rather have /frontend/src/main.ts yuo can add root: path.resolve("..") to vite.config.ts.

``` typescript
import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve(".."),
    css: {
    devSourcemap: true,
    },
    server: {
    hmr: {
        protocol: "ws",
    },
    },
    build: {
    rollupOptions: {
        input: path.join(__dirname, "src", "main.ts"),
    },
    },
});
```

Now if you run npm run dev in Frontend folder and dotnet run you should be seeing

![image 1](./image1.png)

## Setup Production

Since ASP.NET Core uses wwwroot to serve public files we need to change vite.config.ts.

``` typescript
import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    devSourcemap: true,
  },
  server: {
    hmr: {
      protocol: "ws",
    },
  },
  build: {
    outDir: path.resolve("..", "wwwroot", "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, "src", "main.ts"),
    },
  },
});
```

Now when we run npm run build Vite will use Rollup to bundle and build for production to folder “/wwwroot/dist/”.

Then we need to add the generated files to our head tag “/Pages/Shared/_Layout.cshtml” and add this inside of the head tag.

``` typescript
<environment exclude="Development">
    <script type="module" defer async asp-src-include="~/dist/**/*.js"></script>
    <link rel="stylesheet" asp-href-include="~/dist/**/*.css" />
</environment>
```

During development Vite will handle CSS imports but now it's a generated file that need to be imported.
The generated bundles will be generated with the naming convention [name].[hash].js. Since we don’t know the hash this can be a problem but we can import files using a glob pattern with a Tag Helper using asp-src-include and asp-href-include.

``` json
"profiles": {
    "Development": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "applicationUrl": "https://localhost:7166;http://localhost:5166",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    "Production": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "applicationUrl": "https://localhost:7166;http://localhost:5166",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Production"
      }
    },
```

Then I run in the frontend folder

``` typescript
npm run build
```

But now when I start the server the javascript and css loads but not the svgs.
![image 1](./image2.png)

when I look it is requesting /assets/typescript.f6ead1af.svg but it should be requesting /dist/assets/typescript.f6ead1af.svg

To fix this is pretty simple we only need change the vite.config.ts

``` typescript
import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig((env) => ({
  css: {
    devSourcemap: true,
  },
  server: {
    hmr: {
      protocol: "ws",
    },
  },
  base: env.mode === 'production' ? '/dist/' : '/',
  build: {
    outDir: path.resolve("..", "wwwroot", "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, "src", "main.ts"),
    },
  },
}));
```

And now both development and production should be working.

You can see a working [sample](https://github.com/Wikenbrant/ASP.NET_Core-Vite) on my github.

In the next parts we will explore code splitting, serverside execution of javascript and rendering of react components.
