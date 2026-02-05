import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Users, 
  Target, 
  Code, 
  Palette, 
  Brain, 
  Camera,
  Github,
  ExternalLink,
  Mail,
  Globe,
  Linkedin
} from 'lucide-react';
import SEO from '../common/SEO';
import StructuredData from '../common/StructuredData';

const About: React.FC = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Story Analysis',
      description: 'Advanced Azure AI models analyze your narrative structure, characters, and themes to generate contextually intelligent storyboard frames with detailed scene descriptions and camera directions.'
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: 'Multiple Art Styles & Genres',
      description: 'Choose from various visual styles (Realistic, Cartoon, Anime, Comic Book, Cinematic, Minimalist) and genres (Action, Drama, Comedy, Horror, Sci-Fi, Fantasy, Romance, Thriller) to perfectly match your creative vision.'
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: 'Professional Cinematography',
      description: 'AI-generated camera angles, shot compositions, and visual elements following industry standards. Perfect for film pre-production, animation planning, and video content creation.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Instant Export & Sharing',
      description: 'Export storyboards as high-quality PDFs, share with team members, or save to the community gallery. Seamless integration with production workflows.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community Gallery',
      description: 'Explore and get inspired by storyboards created by other creators. Like, share, and discover new storytelling approaches in our vibrant community.'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Usage Analytics & Limits',
      description: 'Smart usage tracking with daily limits to ensure fair access. Real-time analytics help you monitor your creative output and plan your projects effectively.'
    }
  ];

  const techStack = [
    { name: 'React 19', description: 'Modern frontend framework with hooks and concurrent features' },
    { name: 'TypeScript', description: 'Type-safe development with excellent IDE support' },
    { name: 'Tailwind CSS', description: 'Utility-first CSS framework for rapid UI development' },
    { name: 'Framer Motion', description: 'Production-ready motion library for smooth animations' },
    { name: 'Vite', description: 'Lightning-fast build tool and development server' },
    { name: 'Azure Functions', description: 'Serverless compute service with Node.js runtime for scalable backend' },
    { name: 'Azure Blob Storage', description: 'Object storage solution for unstructured data' },
    { name: 'Azure AI Foundry', description: 'Platform for building and deploying AI models' }
  ];

  const collaborators = [
    {
      name: 'AyaNexus 🦢',
      role: 'Creator & Developer',
      description: 'Sole creator, developer, and architect of Scripto. Responsible for all aspects of the project including ideation, design, AI/ML implementation, frontend & backend development, cloud architecture, and deployment.',
      github: 'https://github.com/1AyaNabil1',
      linkedin: 'https://www.linkedin.com/in/ayanabil11/',
      website: 'https://ayanexus.dev/',
      avatar: 'A',
      contributions: [
        'Project concept and ideation',
        'AI/ML architecture and model training',
        'Azure AI Foundry integration (DALL-E, GPT-4 Mini, DeepSeek R1)',
        'Full-stack development (React, TypeScript, Azure Functions)',
        'UI/UX design and implementation',
        'Cloud architecture and Azure deployment',
        'Database design and implementation',
        'Gallery and community features',
        'Performance optimization and DevOps',
        'Complete system architecture'
      ]
    }
  ];

  const projectTimeline = [
    {
      phase: 'Project Inception',
      period: 'April 2025',
      lead: 'Aya',
      features: [
        'Initial project concept and ideation',
        'Local GenAI models for text generation',
        'Local image generation implementation',
        'Basic UI for user input and outputs',
        'Initial logic and workflow design'
      ],
      description: 'Initial concept and development of AI storyboard system using local models'
    },
    {
      phase: 'AI Enhancement & Migration',
      period: 'May 2025',
      lead: 'Aya',
      features: [
        'Migration to Azure AI Foundry models',
        'DALL-E integration for image generation',
        'GPT-4 Mini integration for text processing',
        'Enhanced AI logic and performance',
        'Jupyter notebook implementations'
      ],
      description: 'Transitioning from local models to Azure AI services with improved performance'
    },
    {
      phase: 'Development & Refinement',
      period: 'June 2025',
      lead: 'Aya',
      features: [
        'Python scripts optimization',
        'Bug fixes and stability improvements',
        'Logic refinement and testing',
        'Model output enhancement',
        'Performance optimization'
      ],
      description: 'Stabilizing the core functionality and fixing initial implementation issues'
    },
    {
      phase: 'Frontend Development',
      period: 'July 2025',
      lead: 'Aya',
      features: [
        'React frontend initialization',
        'Complete code refactoring',
        'UI/UX design and implementation',
        'Frontend-backend logic synchronization',
        'Enhanced model output processing'
      ],
      description: 'Building modern React frontend while maintaining core logic integrity'
    },
    {
      phase: 'Production Deployment',
      period: 'August 2025',
      lead: 'Aya',
      features: [
        'Azure Functions backend deployment',
        'Migration to DeepSeek R3 from GPT-4 Mini',
        'Gallery and sharing functionalities',
        'Community features implementation',
        'Production-ready optimizations'
      ],
      description: 'Deploying to production with advanced features and community platform'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <>
      <SEO 
        title="About Scripto - AI-Powered Visual Storytelling"
        description="Learn about Scripto, our mission to democratize visual storytelling through AI technology. Discover the technology behind professional storyboard generation."
        keywords="about Scripto, visual storytelling technology, AI development team, storyboard creation tools, Azure AI, React development"
        url="https://scripto.ayanexus.dev/about"
        canonical="https://scripto.ayanexus.dev/about"
      />
      <StructuredData 
        type="WebApplication"
        data={{
          name: "Scripto",
          description: "Create professional storyboards from text using AI. Generate visual narratives with advanced AI models, multiple art styles, and instant export options.",
          url: "https://scripto.ayanexus.dev/",
          author: [
            {
              "@type": "Person",
              name: "AyaNexus",
              url: "https://ayanexus.dev",
              sameAs: [
                "https://github.com/1AyaNabil1",
                "https://www.linkedin.com/in/ayanabil11/"
              ]
            }
          ],
          applicationCategory: "DesignApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
          },
          featureList: [
            "AI-powered storyboard generation",
            "Multiple art styles",
            "Professional layouts",
            "Instant export options",
            "Story analysis and visualization"
          ]
        }}
      />
      <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mb-8"
          >
            <Sparkles className="w-10 h-10" />
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6">
            About Scripto
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
            The future of visual storytelling is here. Transform your written narratives into 
            professional storyboards using advanced Azure AI models. From concept to completion, 
            create stunning visual stories in minutes, not days.
          </p>
        </div>
      </motion.div>

      {/* Mission Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Vision
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                AI Storyboard Weaver represents the future of visual storytelling. We're democratizing 
                the storyboarding process by making professional-quality visual narratives accessible 
                to creators across all industries - from indie filmmakers and content creators to 
                marketing professionals and educators.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Our platform combines the analytical power of Azure AI with intuitive design, 
                allowing anyone to transform written stories into compelling visual sequences. 
                We believe every narrative deserves to be seen, not just read.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                By leveraging cutting-edge AI technology, we're not replacing human creativity - 
                we're amplifying it, giving storytellers the tools to bring their visions to life 
                faster and more effectively than ever before.
              </p>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 h-130 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">100+ Stories Visualized</h3>
                  <p className="text-gray-600 mb-2">Across multiple genres and styles</p>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <div className="font-semibold text-blue-600">10+</div>
                      <div className="text-gray-600">Active Users</div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-600">8</div>
                      <div className="text-gray-600">Art Styles</div>
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">9</div>
                      <div className="text-gray-600">Genres</div>
                    </div>
                    <div>
                      <div className="font-semibold text-orange-600">99%</div>
                      <div className="text-gray-600">Uptime</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features-section"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to bring your stories to life with professional-quality storyboards
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-stone-50 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Technology Stack */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
              <Code className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leveraging cutting-edge technologies to deliver a fast, reliable, and scalable platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
              >
                <h3 className="font-bold text-gray-900 mb-2">{tech.name}</h3>
                <p className="text-sm text-gray-600">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Project Timeline & Development Phases */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Development Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From concept to reality - explore how we built AI Storyboard Weaver through collaborative development phases
            </p>
          </motion.div>

          <div className="space-y-8">
            {projectTimeline.map((phase, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative"
              >
                {/* Timeline Line */}
                {index < projectTimeline.length - 1 && (
                  <div className="absolute left-8 top-20 w-0.5 h-32 bg-gradient-to-b from-blue-500 to-purple-600 hidden md:block" />
                )}
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Timeline Marker */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{phase.phase}</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {phase.period}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                            Led by {phase.lead}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{phase.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {phase.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Team & Collaborators Section */}
      <motion.section
        id="team-section"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-6">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Meet Project Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The talented individuals behind Scripto, bringing diverse expertise to create something amazing
            </p>
          </motion.div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
              {collaborators.map((collaborator, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {collaborator.avatar}
                  </div>
                </div>

                {/* Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{collaborator.name}</h3>
                  <p className="text-blue-600 font-semibold mb-4">{collaborator.role}</p>
                  <p className="text-gray-600 leading-relaxed mb-6">{collaborator.description}</p>
                </div>

                {/* Contributions */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Key Contributions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {collaborator.contributions.map((contribution, contribIndex) => (
                      <div key={contribIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{contribution}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-4">
                  <motion.a
                    href={collaborator.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors duration-200"
                    aria-label={`${collaborator.name}'s GitHub`}
                  >
                    <Github className="w-6 h-6" />
                  </motion.a>
                  <motion.a
                    href={collaborator.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors duration-200"
                    aria-label={`${collaborator.name}'s LinkedIn`}
                  >
                    <Linkedin className="w-6 h-6" />
                  </motion.a>
                </div>
              </motion.div>
            ))}
            </div>
          </div>

          {/* Call to Action for Contributors */}
          <motion.div
            variants={itemVariants}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Our Project</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                If you have more ideas and are a passionate developer, designer, or AI enthusiast who wants to contribute to this project, we would love to have you!
                Whether it's code, design, documentation, or ideas - every contribution matters!
              </p>
              <motion.a
                href="https://github.com/1AyaNabil1/scripto/fork"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                <Github className="w-5 h-5" />
                Contribute on GitHub
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Open Source Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 bg-gray-900 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl mb-8"
          >
            <Github className="w-10 h-10" />
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Open Source & Community Driven
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            Scripto is built with transparency in mind. Explore the code, 
            contribute features, or customize it for your specific needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="https://github.com/1AyaNabil1/scripto"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              <Github className="w-5 h-5" />
              View on GitHub
              <ExternalLink className="w-4 h-4" />
            </motion.a>
            
            <motion.a
              href="https://ayanexus.dev"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors duration-200"
            >
              <Globe className="w-5 h-5" />
              Visit My Website
              <ExternalLink className="w-4 h-4" />
            </motion.a>
          </div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 bg-gradient-to-br from-blue-50 to-purple-50"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-8"
          >
            <Mail className="w-8 h-8 text-blue-600" />
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Have questions, feedback, or ideas for new features? We'd love to hear from you.
          </p>
          
          <motion.a
            href="mailto:contact@ayanexus.dev"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            <Mail className="w-5 h-5" />
            Send us a message
          </motion.a>
        </div>
      </motion.section>
    </div>
    </>
  );
};

export default About;
