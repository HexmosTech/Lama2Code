#!/bin/bash

yarn
rm -rf *.vsix
sudo npm install -g vsce
cp -r l2lang ~/.vscode/extensions
yes | vsce package
code --install-extension *.vsix
rm -rf *.vsix

GREEN='\033[0;32m'
NC='\033[0m' # No Color
printf "${GREEN}Please restart VS Code for full functional availability of the update.${NC}\n"
