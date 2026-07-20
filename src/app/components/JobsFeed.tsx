import { useEffect } from 'react';

const jobsXML = `<?xml version="1.0" encoding="UTF-8"?>
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

export function JobsFeed() {
  useEffect(() => {
    // Create a route handler for /jobs.xml
    const currentPath = window.location.pathname;
    if (currentPath === '/jobs.xml' || currentPath === '/jobs') {
      // Set the content type and serve XML
      const blob = new Blob([jobsXML], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      window.location.href = url;
    }
  }, []);

  return null;
}

export { jobsXML };
