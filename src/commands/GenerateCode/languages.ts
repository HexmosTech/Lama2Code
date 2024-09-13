let a = {
  shell: {
    info: {
      key: "shell",
      title: "Shell",
      extname: ".sh",
      default: "curl",
    },
    clientsById: {
      curl: null,
      httpie: null,
      wget: null,
    },
  },
  powershell: {
    info: {
      key: "powershell",
      title: "Powershell",
      extname: ".ps1",
      default: "webrequest",
    },
    clientsById: {
      webrequest: null,
      restmethod: null,
    },
  },
  ocaml: {
    info: {
      key: "ocaml",
      title: "OCaml",
      extname: ".ml",
      default: "cohttp",
    },
    clientsById: {
      cohttp: null,
    },
  },
  csharp: {
    info: {
      key: "csharp",
      title: "C#",
      extname: ".cs",
      default: "restsharp",
    },
    clientsById: {
      httpclient: null,
      restsharp: null,
    },
  },
  r: {
    info: {
      key: "r",
      title: "R",
      extname: ".r",
      default: "httr",
    },
    clientsById: {
      httr: null,
    },
  },
  php: {
    info: {
      key: "php",
      title: "PHP",
      extname: ".php",
      default: "curl",
    },
    clientsById: {
      curl: null,
      guzzle: null,
      http1: null,
      http2: null,
    },
  },
  ruby: {
    info: {
      key: "ruby",
      title: "Ruby",
      extname: ".rb",
      default: "native",
    },
    clientsById: {
      native: null,
    },
  },
  clojure: {
    info: {
      key: "clojure",
      title: "Clojure",
      extname: ".clj",
      default: "clj_http",
    },
    clientsById: {
      clj_http: null,
    },
  },
  java: {
    info: {
      key: "java",
      title: "Java",
      extname: ".java",
      default: "unirest",
    },
    clientsById: {
      asynchttp: null,
      nethttp: null,
      okhttp: null,
      unirest: null,
    },
  },
  http: {
    info: {
      key: "http",
      title: "HTTP",
      extname: null,
      default: "1.1",
    },
    clientsById: {
      "http1.1": null,
    },
  },
  swift: {
    info: {
      key: "swift",
      title: "Swift",
      extname: ".swift",
      default: "nsurlsession",
    },
    clientsById: {
      nsurlsession: null,
    },
  },
  node: {
    info: {
      key: "node",
      title: "Node.js",
      extname: ".js",
      default: "native",
    },
    clientsById: {
      native: null,
      request: null,
      unirest: null,
      axios: null,
      fetch: null,
    },
  },
  c: {
    info: {
      key: "c",
      title: "C",
      extname: ".c",
      default: "libcurl",
    },
    clientsById: {
      libcurl: null,
    },
  },
  go: {
    info: {
      key: "go",
      title: "Go",
      extname: ".go",
      default: "native",
    },
    clientsById: {
      native: null,
    },
  },
  python: {
    info: {
      key: "python",
      title: "Python",
      extname: ".py",
      default: "python3",
    },
    clientsById: {
      python3: null,
      requests: null,
    },
  },
  kotlin: {
    info: {
      key: "kotlin",
      title: "Kotlin",
      extname: ".kt",
      default: "okhttp",
    },
    clientsById: {
      okhttp: null,
    },
  },
  javascript: {
    info: {
      key: "javascript",
      title: "JavaScript",
      extname: ".js",
      default: "xhr",
    },
    clientsById: {
      xhr: null,
      axios: null,
      fetch: null,
      jquery: null,
    },
  },
  objc: {
    info: {
      key: "objc",
      title: "Objective-C",
      extname: ".m",
      default: "nsurlsession",
    },
    clientsById: {
      nsurlsession: null,
    },
  },
}
export default a
