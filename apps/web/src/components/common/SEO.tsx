import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = "Scripto - AI-Powered Visual Storytelling Platform",
  description = "Transform your stories into stunning visual narratives with Scripto's advanced AI technology. Create professional storyboards, explore community galleries, and bring your creative vision to life with cutting-edge AI art generation.",
  keywords = "Scripto, AI storyboard generator, visual storytelling platform, AI art creation, storyboard maker, creative AI tools, digital storytelling, AI-powered narratives, story visualization, professional storyboards",
  image = "https://Scripto.ashraf.zone/icon.ico",
  url = "https://Scripto.ashraf.zone/",
  type = "website",
  canonical
}) => {
  const siteTitle = "Scripto";
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Scripto Team" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Scripto" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:site" content="@Scripto" />
      <meta property="twitter:creator" content="@Scripto" />

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="application-name" content="Scripto" />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
};

export default SEO;
