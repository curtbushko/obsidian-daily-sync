{
  description = "Development environment for Obsidian Daily Sync plugin";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js LTS with npm
            nodejs_20

            # Build and development tools
            nodePackages.typescript
            nodePackages.typescript-language-server
            nodePackages.eslint

            # Additional development utilities
            git
            jq
          ];

          shellHook = ''
            # Auto-pull if on main branch
            if [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "main" ]; then
              echo "On main branch, pulling latest changes..."
              git pull --quiet || true
            fi

            echo "Obsidian Plugin Development Environment"
            echo "========================================"
            echo "Node version: $(node --version)"
            echo "npm version: $(npm --version)"
            echo ""
            echo "Installing dependencies..."
            npm install
            echo ""
            echo "Quick start:"
            echo "  make help        - Show all available make targets"
            echo "  make dev         - Run development build (watch mode)"
            echo "  make build       - Production build"
            echo "  make test        - Run tests"
            echo "  make lint        - Check code quality"
            echo "  make lint-fix    - Fix linting issues automatically"
            echo ""
          '';
        };
      }
    );
}
