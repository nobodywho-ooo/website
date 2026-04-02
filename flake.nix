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
      ];
      perSystem =
        { pkgs, self', ... }:
        {
          packages.default = pkgs.buildNpmPackage {
            pname = "nobodywho-website";
            version = "1.0.0";
            src = ./.;
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
          devShells.default = pkgs.mkShell {
            inputsFrom = [ self'.packages.default ];
          };
        };
    };
}
