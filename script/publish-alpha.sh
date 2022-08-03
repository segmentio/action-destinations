#!/bin/bash
#
# Description:
#   - A handy utility that takes care of releasing alpha package in staging.
#   - Automatically bump to correct next alpha version.
#Run:
#   - Give execute permission to publish-alpha and run:
#   - ~ chmod +x ./bin/publish-alpha.sh
#   - ~ ./bin/publish-alpha.sh
true
brew install coreutils
MODULE_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"
PACKAGE_DIR="$MODULE_DIR/../packages"
IGNORE_DIR=("cli" "cli-internal" "..")
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;

# Process and prepare
git checkout staging
nvm use
yarn install

# Try to publish alpha version
{
    yarn lerna publish prerelease --pre-dist-tag next --allow-branch '**' --no-git-tag-version --yes
}||{
    echo "❌Failed to publish alpha, updating version to next tag"
    for d in $(find $PACKAGE_DIR -maxdepth 1 -type d)
    do
        pkg_path="$(basename "$d")"
        if [[ " ${IGNORE_DIR[*]} " =~ " ${pkg_path} " ]]; 
        then
            continue
        else
            FILE="$d/package.json"
            if [ -f "$FILE" ]; then
                # Get the package name in JSON file
                pkg_name=$( sed -n 's/.*"name":.*"\(.*\)"\(,\)\{0,1\}/\1/p' "$FILE" )
                # Get the next tag from npm
                ver=$(npm view  ${pkg_name}@next version)
                echo "✅Bumping ${pkg_name} into next tag version ${ver}"
                cd ${d}
                # Bump to next tag, update package file
                npm version --no-git-tag-version ${ver} 
            fi
        fi
    done
    cd "${PACKAGE_DIR}/.."
    yarn lerna publish prerelease --pre-dist-tag next --allow-branch '**' --no-git-tag-version --yes
} 