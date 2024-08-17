# Lama2 for VSCode

Lama2 is a VSCode support extension for [Lama2](https://github.com/HexmosTech/Lama2).

![](https://github.com/HexmosTech/Lama2/raw/main/banner.png)

## Demo

![](https://github.com/HexmosTech/Lama2/raw/main/docs/Lama2/docs/demo2.gif)

## About

_Lama2_ is a plain-text powered REST API client & manager built for serious engineering teams.
_Lama2_ specifies the .l2 syntax for describing APIs, and implements a CLI to execute .l2 files. Engineers can collaborate on `.l2` files using version control. _Lama2_ integrates nicely with
IDEs and text-editors as well. Think of _Lama2_ as **markdown for APIs.**

## Benefits

1. **Plain-text files:** Store APIs in the plain-text `.l2` API files. Simple and human-friendly syntax. Learn basics within minutes!
1. **Simple CLI:** Launch the CLI tool `l2` on API files to make REST API requests.
1. **Editor support:** Invoke _Lama2_ from your favorite text editor or IDE. Helpful documentation and tool support to build editor extensions included.
1. **Longevity & track-ability:** Commit `.l2` files to `git` or other version control for long life & change tracking.
1. **Collaboration:** Share API repo with teammates and colleagues to collaborate
1. **Documentation:** Explore tutorials, how-tos, explanations, references, FAQ/RAQs, and diagrams. Documentation is a priority, so that you never have to get lost.
1. **Extensibility:** `.l2` syntax is implemented as a _recursive descent parser_, based on a clearly specified grammar. Dig into details and implement new syntax (ex: to support `websockets`)

## Extension Features

1. Execute the focused `.l2` file through `Execute this file`

## Extension Settings

No settings presently.

## Known Issues

Still in development

## Release Notes

### 0.0.2

Introduced the `install.sh` script plus `.http` file type to language association.

### 0.0.1

Introduced the `Execute this file` command.
