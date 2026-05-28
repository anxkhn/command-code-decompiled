'use strict';

var vscode2 = require('vscode');
var crypto = require('crypto');
var path2 = require('path');
var net = require('net');
var fs = require('fs');
var os = require('os');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var vscode2__namespace = /*#__PURE__*/_interopNamespace(vscode2);
var path2__namespace = /*#__PURE__*/_interopNamespace(path2);
var net__namespace = /*#__PURE__*/_interopNamespace(net);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var os__namespace = /*#__PURE__*/_interopNamespace(os);

// src/extension.ts
var getWorkspaceRoot = () => vscode2__namespace.workspace.workspaceFolders?.[0]?.uri.fsPath;
var getWorkspaceName = () => vscode2__namespace.workspace.name;
var getRelativePath = (absolutePath) => {
  const root = getWorkspaceRoot();
  if (!root) return absolutePath;
  return path2__namespace.relative(root, absolutePath);
};

// src/context-provider.ts
var getTabSize = (options) => typeof options.tabSize === "number" ? options.tabSize : 4;
var buildCursorInfo = (position) => ({
  line: position.line + 1,
  // 1-indexed for display
  column: position.character + 1
  // 1-indexed for display
});
var buildActiveFileInfo = (editor) => {
  const { document, selection, options } = editor;
  const position = selection.active;
  return {
    path: document.uri.fsPath,
    relativePath: getRelativePath(document.uri.fsPath),
    language: document.languageId,
    lineCount: document.lineCount,
    cursor: buildCursorInfo(position),
    encoding: document.uri.scheme === "file" ? "utf-8" : document.uri.scheme,
    tabSize: getTabSize(options)
  };
};
var buildSelectionInfo = (editor, maxLength) => {
  const { selection, document } = editor;
  if (selection.isEmpty) return null;
  const text = document.getText(selection);
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
  return {
    text: truncatedText,
    startLine: selection.start.line + 1,
    // 1-indexed
    endLine: selection.end.line + 1,
    // 1-indexed
    lineCount: selection.end.line - selection.start.line + 1
  };
};
var buildOpenFileInfo = (editor, activeFilePath) => {
  const { document } = editor;
  return {
    path: document.uri.fsPath,
    relativePath: getRelativePath(document.uri.fsPath),
    language: document.languageId,
    isActive: document.uri.fsPath === activeFilePath
  };
};
var deduplicateFiles = (files) => files.filter(
  (file, index, self) => self.findIndex((f) => f.path === file.path) === index
);
var ContextProvider = class {
  disposables = [];
  cachedContext = null;
  config;
  constructor() {
    this.config = vscode2__namespace.workspace.getConfiguration("commandcode.context");
    this.setupListeners();
    this.updateContext();
  }
  /**
   * Setup event listeners for context changes
   */
  setupListeners() {
    this.disposables.push(
      vscode2__namespace.window.onDidChangeActiveTextEditor(
        () => this.updateContext()
      ),
      vscode2__namespace.window.onDidChangeTextEditorSelection(
        () => this.updateContext()
      ),
      vscode2__namespace.workspace.onDidOpenTextDocument(() => this.updateContext()),
      vscode2__namespace.workspace.onDidCloseTextDocument(() => this.updateContext()),
      vscode2__namespace.workspace.onDidChangeConfiguration((e) => {
        if (!e.affectsConfiguration("commandcode.context")) return;
        this.config = vscode2__namespace.workspace.getConfiguration(
          "commandcode.context"
        );
        this.updateContext();
      })
    );
  }
  /**
   * Update cached context
   */
  async updateContext() {
    this.cachedContext = await this.buildContext();
  }
  /**
   * Get current VS Code context
   */
  async getContext() {
    if (!this.cachedContext) {
      this.cachedContext = await this.buildContext();
    }
    return this.cachedContext;
  }
  /**
   * Build context from current VS Code state
   */
  async buildContext() {
    const workspace4 = this.getWorkspaceInfo();
    const activeFile = this.getActiveFileInfo();
    const selection = this.getSelectionInfo();
    const openFiles = this.getOpenFiles();
    return {
      timestamp: Date.now(),
      workspace: workspace4,
      activeFile,
      selection,
      openFiles
    };
  }
  /**
   * Get workspace information
   */
  getWorkspaceInfo() {
    const rootPath = getWorkspaceRoot() || process.cwd();
    const name = getWorkspaceName();
    return { rootPath, name };
  }
  /**
   * Get active file information
   */
  getActiveFileInfo() {
    const editor = vscode2__namespace.window.activeTextEditor;
    if (!editor) return null;
    return buildActiveFileInfo(editor);
  }
  /**
   * Get selection information
   */
  getSelectionInfo() {
    const editor = vscode2__namespace.window.activeTextEditor;
    if (!editor) return null;
    const maxLength = this.config.get("maxSelectionLength", 1e4);
    return buildSelectionInfo(editor, maxLength);
  }
  /**
   * Get list of open files
   */
  getOpenFiles() {
    const activeEditor = vscode2__namespace.window.activeTextEditor;
    const activeFilePath = activeEditor?.document.uri.fsPath;
    const files = vscode2__namespace.window.visibleTextEditors.map(
      (editor) => buildOpenFileInfo(editor, activeFilePath)
    );
    return deduplicateFiles(files);
  }
  /**
   * Dispose of resources
   */
  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
};
var severityToString = (severity) => {
  switch (severity) {
    case vscode2__namespace.DiagnosticSeverity.Error:
      return "error";
    case vscode2__namespace.DiagnosticSeverity.Warning:
      return "warning";
    case vscode2__namespace.DiagnosticSeverity.Information:
      return "information";
    case vscode2__namespace.DiagnosticSeverity.Hint:
      return "hint";
    default: {
      return "information";
    }
  }
};
var diagnosticCodeToString = (code) => {
  if (code === void 0 || code === null) return null;
  if (typeof code === "object" && "value" in code) return String(code.value);
  return String(code);
};
var collectDiagnostics = (filePaths) => {
  if (filePaths && filePaths.length === 0) return [];
  let rawDiagnostics;
  if (filePaths) {
    rawDiagnostics = filePaths.map((fp) => {
      const uri = vscode2__namespace.Uri.file(fp);
      return [uri, vscode2__namespace.languages.getDiagnostics(uri)];
    });
  } else {
    rawDiagnostics = vscode2__namespace.languages.getDiagnostics();
  }
  const fileDiagnostics = rawDiagnostics.filter(
    ([uri, diags]) => uri.scheme === "file" && diags.length > 0
  );
  return fileDiagnostics.map(([fileUri, diags]) => ({
    file: fileUri.fsPath,
    relativePath: getRelativePath(fileUri.fsPath),
    diagnostics: diags.map(toDiagnosticEntry)
  }));
};
var toDiagnosticEntry = (d) => ({
  range: {
    startLine: d.range.start.line + 1,
    startCol: d.range.start.character + 1,
    endLine: d.range.end.line + 1,
    endCol: d.range.end.character + 1
  },
  message: d.message,
  severity: severityToString(d.severity),
  source: d.source ?? null,
  code: diagnosticCodeToString(d.code)
});

// src/utils/ipc-caps.ts
var MAX_BUFFER_BYTES = 8 * 1024 * 1024;
var MAX_MESSAGE_BYTES = 4 * 1024 * 1024;
var MAX_CONNECTIONS = 16;
var IDLE_TIMEOUT_MS = 6e4;
var exceedsBufferCap = (buffer, incomingBytes) => Buffer.byteLength(buffer, "utf-8") + incomingBytes > MAX_BUFFER_BYTES;
var exceedsMessageCap = (message) => Buffer.byteLength(message, "utf-8") > MAX_MESSAGE_BYTES;

// src/ipc-server.ts
var SESSION_DIR = path2__namespace.join(os__namespace.homedir(), ".commandcode", "ide");
var IPC_ACTIONS = {
  GET_CONTEXT: "getContext",
  GET_DIAGNOSTICS: "getDiagnostics"
};
var ensureSessionDir = () => {
  fs__namespace.mkdirSync(SESSION_DIR, { recursive: true, mode: 448 });
  try {
    fs__namespace.chmodSync(SESSION_DIR, 448);
  } catch {
  }
};
var getSocketPath = (sessionId, ideName) => {
  const shortId = sessionId.slice(0, 8);
  if (process.platform === "win32") {
    return `\\\\.\\pipe\\commandcode-${ideName}-${shortId}`;
  }
  return path2__namespace.join(SESSION_DIR, `${ideName}-${shortId}.sock`);
};
var writeSessionFile = (sessionId, socketPath, workspaceFolders, ideName) => {
  ensureSessionDir();
  const shortId = sessionId.slice(0, 8);
  const filePath = path2__namespace.join(SESSION_DIR, `${ideName}-${shortId}.json`);
  const tmpPath = `${filePath}.tmp`;
  const data = {
    socketPath,
    workspaceFolders,
    pid: process.pid,
    ideName,
    timestamp: Date.now()
  };
  try {
    fs__namespace.unlinkSync(tmpPath);
  } catch {
  }
  const fd = fs__namespace.openSync(
    tmpPath,
    fs__namespace.constants.O_WRONLY | fs__namespace.constants.O_CREAT | fs__namespace.constants.O_EXCL,
    384
  );
  try {
    fs__namespace.writeFileSync(fd, JSON.stringify(data));
  } finally {
    fs__namespace.closeSync(fd);
  }
  fs__namespace.renameSync(tmpPath, filePath);
  try {
    fs__namespace.chmodSync(filePath, 384);
  } catch {
  }
};
var removeSessionFile = (sessionId, ideName) => {
  const shortId = sessionId.slice(0, 8);
  const base = path2__namespace.join(SESSION_DIR, `${ideName}-${shortId}`);
  for (const ext of [".json", ".sock"]) {
    try {
      fs__namespace.unlinkSync(`${base}${ext}`);
    } catch {
    }
  }
};
var cleanupSocket = (socketPath) => {
  if (process.platform === "win32") return;
  if (!fs__namespace.existsSync(socketPath)) return;
  try {
    fs__namespace.unlinkSync(socketPath);
  } catch (error) {
    console.error("Failed to remove existing socket:", error);
  }
};
var parseMessage = (messageStr) => {
  try {
    return JSON.parse(messageStr);
  } catch {
    return null;
  }
};
var createErrorResponse = (id, message, code) => ({
  type: "error",
  id,
  payload: { message, code }
});
var createContextResponse = (id, payload) => ({
  type: "response",
  id,
  payload
});
var createDiagnosticsResponse = (id, diagnostics) => ({
  type: "response",
  id,
  payload: { diagnostics }
});
var IPCServer = class {
  constructor(contextProvider2, socketPath) {
    this.contextProvider = contextProvider2;
    this.socketPath = socketPath;
    this.outputChannel = vscode2__namespace.window.createOutputChannel(
      "CommandCode Context"
    );
  }
  server = null;
  socketPath;
  connections = /* @__PURE__ */ new Set();
  outputChannel;
  log(message) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[1].slice(0, 12);
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }
  async start() {
    ensureSessionDir();
    cleanupSocket(this.socketPath);
    this.server = net__namespace.createServer((socket) => this.handleConnection(socket));
    return new Promise((resolve, reject) => {
      this.server.listen(this.socketPath, () => {
        try {
          fs__namespace.chmodSync(this.socketPath, 384);
        } catch (error) {
          this.log(
            `chmod socket failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
        this.log(`IPC server started`);
        resolve();
      });
      this.server.on("error", (error) => {
        this.log(`Server error: ${error.message}`);
        reject(error);
      });
    });
  }
  handleConnection(socket) {
    if (this.connections.size >= MAX_CONNECTIONS) {
      this.log(`Connection cap reached (${MAX_CONNECTIONS}); rejecting`);
      socket.destroy();
      return;
    }
    this.connections.add(socket);
    socket.on("close", () => {
      this.connections.delete(socket);
    });
    socket.setTimeout(IDLE_TIMEOUT_MS);
    socket.on("timeout", () => {
      this.log(`Connection idle for ${IDLE_TIMEOUT_MS}ms; closing`);
      socket.destroy();
    });
    socket.on("error", (error) => {
      this.log(`Connection error: ${error.message}`);
    });
    let buffer = "";
    socket.on("data", async (data) => {
      if (exceedsBufferCap(buffer, data.length)) {
        const total = Buffer.byteLength(buffer, "utf-8") + data.length;
        this.log(
          `Buffer cap exceeded (${total}B); dropping connection`
        );
        socket.destroy();
        return;
      }
      buffer += data.toString();
      const messages = buffer.split("\n");
      buffer = messages.pop() || "";
      for (const messageStr of messages) {
        if (exceedsMessageCap(messageStr)) {
          this.log(
            `Message exceeded ${MAX_MESSAGE_BYTES}B; dropping connection`
          );
          socket.destroy();
          return;
        }
        if (!messageStr.trim()) continue;
        await this.handleMessage(socket, messageStr);
      }
    });
  }
  async handleMessage(socket, messageStr) {
    const message = parseMessage(messageStr);
    if (!message) {
      const errorResponse = createErrorResponse(
        crypto.randomUUID(),
        "Failed to parse message",
        "PARSE_ERROR"
      );
      this.sendMessage(socket, errorResponse);
      return;
    }
    if (message.type !== "request") return;
    await this.handleRequest(socket, message);
  }
  async handleRequest(socket, request) {
    const { action } = request.payload;
    try {
      if (action === IPC_ACTIONS.GET_CONTEXT) {
        const context = await this.contextProvider.getContext();
        const response = createContextResponse(request.id, context);
        this.sendMessage(socket, response);
        return;
      }
      if (action === IPC_ACTIONS.GET_DIAGNOSTICS) {
        const diagnostics = collectDiagnostics(
          request.payload.filePaths
        );
        const response = createDiagnosticsResponse(
          request.id,
          diagnostics
        );
        this.sendMessage(socket, response);
        return;
      }
      const errorResponse = createErrorResponse(
        request.id,
        `Unknown action: ${action}`,
        "UNKNOWN_ACTION"
      );
      this.sendMessage(socket, errorResponse);
    } catch (error) {
      this.log(`Error handling ${action}: ${error}`);
      const errorResponse = createErrorResponse(
        request.id,
        error instanceof Error ? error.message : "Unknown error",
        "INTERNAL_ERROR"
      );
      this.sendMessage(socket, errorResponse);
    }
  }
  sendMessage(socket, message) {
    try {
      socket.write(JSON.stringify(message) + "\n");
    } catch (error) {
      this.log(`Failed to send message: ${error}`);
    }
  }
  async stop() {
    for (const socket of this.connections) {
      socket.end();
    }
    this.connections.clear();
    if (!this.server) return;
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
  dispose() {
    for (const socket of this.connections) {
      socket.destroy();
    }
    this.connections.clear();
    this.server?.close();
    cleanupSocket(this.socketPath);
    this.outputChannel.dispose();
  }
};

// src/extension.ts
var contextProvider;
var ipcServer;
var currentSessionId;
var currentIdeName;
var initializeComponents = async (socketPath) => {
  contextProvider = new ContextProvider();
  ipcServer = new IPCServer(contextProvider, socketPath);
  try {
    await ipcServer.start();
    console.log("CommandCode extension started");
  } catch (error) {
    console.error("Failed to start IPC server:", error);
    vscode2__namespace.window.showErrorMessage(
      "CommandCode: Failed to start context server. CLI integration may not work."
    );
  }
};
var detectIdeName = () => {
  const appName = vscode2__namespace.env.appName.toLowerCase();
  if (appName.includes("cursor")) return "cursor";
  if (appName.includes("windsurf")) return "windsurf";
  return "code";
};
var registerCommands = (context) => {
  const openInTerminalCommand = vscode2__namespace.commands.registerCommand(
    "commandcode.openInTerminal",
    () => {
      const terminal = vscode2__namespace.window.createTerminal({
        name: "Command Code",
        cwd: vscode2__namespace.workspace.workspaceFolders?.[0]?.uri.fsPath
      });
      terminal.show();
      terminal.sendText("cmd");
    }
  );
  context.subscriptions.push(openInTerminalCommand);
};
async function activate(context) {
  console.log("CommandCode extension activating...");
  const sessionId = crypto.randomUUID();
  currentSessionId = sessionId;
  const ideName = detectIdeName();
  currentIdeName = ideName;
  const socketPath = getSocketPath(sessionId, ideName);
  await initializeComponents(socketPath);
  const workspaceFolders = vscode2__namespace.workspace.workspaceFolders?.map((f) => f.uri.fsPath) || [];
  try {
    writeSessionFile(sessionId, socketPath, workspaceFolders, ideName);
  } catch (error) {
    console.error("CommandCode: failed to write session file:", error);
  }
  registerCommands(context);
  if (contextProvider) context.subscriptions.push(contextProvider);
  if (ipcServer) context.subscriptions.push(ipcServer);
}
function deactivate() {
  if (currentSessionId && currentIdeName) {
    removeSessionFile(currentSessionId, currentIdeName);
  }
  ipcServer?.dispose();
  contextProvider?.dispose();
}

exports.activate = activate;
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
//# sourceMappingURL=extension.js.map