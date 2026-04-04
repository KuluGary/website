<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">

<xsl:output method="html" indent="yes"/>

<xsl:template match="/">
  <html>
    <head>
      <title><xsl:value-of select="/atom:feed/atom:title"/></title>
      <style>
        body {
          font-family: system-ui, sans-serif;
          max-width: 700px;
          margin: 40px auto;
          line-height: 1.6;
          padding: 0 16px;
        }
        h1 {
          margin-bottom: 0;
        }
        .entry {
          margin: 24px 0;
        }
				h2 {
					margin-bottom: 10px;
				}
        .date {
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <h1><xsl:value-of select="/atom:feed/atom:title"/></h1>
      <p><xsl:value-of select="/atom:feed/atom:subtitle"/></p>

      <xsl:for-each select="/atom:feed/atom:entry">
				<div class="entry">
					<h2>
						<a>
							<xsl:attribute name="href">
								<xsl:value-of select="atom:link/@href"/>
							</xsl:attribute>
							<xsl:value-of select="atom:title"/>
						</a>
					</h2>

					<div class="date">
						<xsl:value-of select="atom:updated"/>
					</div>

					<div class="content">
						<xsl:value-of select="atom:summary" disable-output-escaping="yes"/>
					</div>
				</div>
			</xsl:for-each>

    </body>
  </html>
</xsl:template>

</xsl:stylesheet>