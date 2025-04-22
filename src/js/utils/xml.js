const { XMLParser } = require("fast-xml-parser");

function parseXML(XMLData) {
  const parser = new XMLParser({ ignoreAttributes: false });

  return parser.parse(XMLData);
}

module.exports = { parseXML };
