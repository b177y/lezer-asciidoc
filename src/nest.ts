import {TreeCursor, SyntaxNode, Parser, Input, parseMixed} from "@lezer/common"
import {Type, AsciidocExtension} from "./asciidoc"

function leftOverSpace(node: SyntaxNode, from: number, to: number) {
  let ranges = []
  for (let n = node.firstChild, pos = from;; n = n.nextSibling) {
    let nextPos = n ? n.from : to
    if (nextPos > pos) ranges.push({from: pos, to: nextPos})
    if (!n) break
    pos = n.to
  }
  return ranges
}

/// Create a Asciidoc extension to enable nested parsing on code blocks.
export function parseCode(config: {
  /// When provided, this will be used to parse the content of code
  /// blocks. `info` is the string after the opening ` ``` ` marker,
  /// or the empty string if there is no such info or this is an
  /// indented code block. If there is a parser available for the
  /// code, it should return a function that can construct the
  /// [parse](https://lezer.codemirror.net/docs/ref/#common.PartialParse).
  codeParser?: (info: string) => null | Parser
}): AsciidocExtension {
  let {codeParser} = config
  let wrap = parseMixed((node: TreeCursor, input: Input) => {
    let id = node.type.id
    if (codeParser && (id == Type.CodeBlock || id == Type.FencedCode)) {
      let info = ""
      if (id = Type.FencedCode) {
        let infoNode = node.node.getChild(Type.CodeInfo)
        if (infoNode) info = input.read(infoNode.from, infoNode.to)
      }
      let parser = codeParser(info)
      if (parser)
        return {parser, overlay: node => node.type.id == Type.CodeText}
    }
    return null
  })
  return {wrap}
}
