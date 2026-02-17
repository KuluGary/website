import { XMLParser } from "fast-xml-parser";

export function parseXML(XMLData) {
  const parser = new XMLParser({ ignoreAttributes: false });

  return parser.parse(XMLData);
}
