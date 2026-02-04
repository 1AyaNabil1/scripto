import React from 'react';
import SEO from '../common/SEO';
import StoryStructuredData from '../common/StoryStructuredData';

interface StoryPageSEOProps {
  story: {
    id: string;
    title: string;
    description: string;
    userName: string;
    genre: string;
    style: string;
    frames: any[];
    createdAt?: string;
    likes?: number;
  };
}

export const StoryPageSEO: React.FC<StoryPageSEOProps> = ({ story }) => {
  // Get the first frame image for preview
  const getFirstFrameImage = () => {
    try {
      let frames = story.frames;
      if (typeof frames === 'string') {
        frames = JSON.parse(frames);
      }
      return frames[0]?.image_url || 'https://Scripto.ashraf.zone/icon.ico';
    } catch {
      return 'https://Scripto.ashraf.zone/icon.ico';
    }
  };

  const storyDescription = story.description.length > 160 
    ? `${story.description.substring(0, 157)}...` 
    : story.description;

  return (
    <>
      <SEO
        title={`${story.title} by ${story.userName} | Scripto`}
        description={`${storyDescription} Created with Scripto's AI storytelling platform. Genre: ${story.genre}, Style: ${story.style}.`}
        keywords={`${story.title}, ${story.userName}, ${story.genre}, ${story.style}, AI storyboard, visual story, Scripto story`}
        image={getFirstFrameImage()}
        url={`https://Scripto.ashraf.zone/story/${story.id}`}
        type="article"
      />
      <StoryStructuredData story={story} />
    </>
  );
};

export default StoryPageSEO;
