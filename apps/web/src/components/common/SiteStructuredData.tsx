import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';

interface SiteStructuredDataProps {
  type?: 'organization' | 'website' | 'webapp';
}

const SiteStructuredData: React.FC<SiteStructuredDataProps> = ({ type = 'website' }) => {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Scripto",
    "alternateName": "Scripto AI Storytelling Platform",
    "url": "https://Scripto.ashraf.zone",
    "logo": "https://Scripto.ashraf.zone/icon.ico",
    "description": "AI-powered visual storytelling platform that transforms text into stunning storyboards",
    "foundingDate": "2024",
    "sameAs": [
      "https://Scripto.ashraf.zone"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://Scripto.ashraf.zone/about"
    }
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Scripto",
    "url": "https://Scripto.ashraf.zone",
    "description": "AI-powered visual storytelling platform that transforms stories into stunning visual narratives",
    "publisher": {
      "@type": "Organization",
      "name": "Scripto"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://Scripto.ashraf.zone/gallery?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const webAppData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Scripto",
    "url": "https://Scripto.ashraf.zone",
    "description": "Create professional storyboards from text using advanced AI technology",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "featureList": [
      "AI-powered storyboard generation",
      "Multiple art styles",
      "Story gallery",
      "Export options",
      "Community sharing"
    ]
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://Scripto.ashraf.zone"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Gallery",
        "item": "https://Scripto.ashraf.zone/gallery"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Try App",
        "item": "https://Scripto.ashraf.zone/try-app"
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteData)}
      </script>
      {type === 'webapp' && (
        <script type="application/ld+json">
          {JSON.stringify(webAppData)}
        </script>
      )}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbData)}
      </script>
    </Helmet>
  );
};

export default SiteStructuredData;
