{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };
  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      perSystem =
        { pkgs, self', ... }:
        {
          packages.default = pkgs.buildNpmPackage {
            pname = "nobodywho-website";
            version = "1.0.0";
            src = ./.;
            nodejs = pkgs.nodejs_22;
            npmDepsHash = "sha256-NNXNz3ISAZEkjvXyQL7+t4n16TN3Pt51D1OPWqulER4=";
            nativeBuildInputs = [ pkgs.pkg-config ];
            buildInputs = [ pkgs.vips ];
            buildPhase = ''
              npm run build
            '';
            installPhase = ''
              cp -r _site $out
            '';
          };
          apps = {
            default = {
              type = "app";
              program = "${pkgs.writeShellScript "serve" ''
                echo "Serving on http://localhost:8080"
                ${pkgs.python3}/bin/python3 -m http.server -d ${self'.packages.default} 8080
              ''}";
            };
            dev = {
              type = "app";
              program = "${pkgs.writeShellScript "dev" ''
                nix develop --command sh -c 'npm install && npm start'
              ''}";
            };
          };
          devShells.default = pkgs.mkShell {
            inputsFrom = [ self'.packages.default ];
          };
        };
    };
}
