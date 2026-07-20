import { useEffect } from 'react';

const jobsXMLContent = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>Your HR Software Name</publisher>
  <publisherurl>https://yourapp.com</publisherurl>
  <job>
    <title><![CDATA[Software Engineer]]></title>
    <date><![CDATA[Tue, 19 May 2026 00:00:00 GMT]]></date>
    <referencenumber><![CDATA[JOB-001]]></referencenumber>
    <url><![CDATA[https://yourapp.com/jobs/001]]></url>
    <company><![CDATA[Acme Corp]]></company>
    <city><![CDATA[Belo Horizonte]]></city>
    <state><![CDATA[MG]]></state>
    <country><![CDATA[BR]]></country>
    <description><![CDATA[Full job description here...]]></description>
    <salary><![CDATA[R$8.000 - R$12.000/month]]></salary>
  </job>
</source>`;

export default function JobsXml() {
  useEffect(() => {
    // Set the document content type to XML
    document.contentType = 'application/xml';
  }, []);

  return (
    <pre style={{ margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      {jobsXMLContent}
    </pre>
  );
}
