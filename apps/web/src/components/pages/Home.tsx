import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Wand2, Image, Users } from 'lucide-react';
import { Button, Card, Container, Section } from '../ui';
import { IconWrapper } from '../shared';
import { AuthAwareButton } from '../common/AuthAwareButton';
import SEO from '../common/SEO';
import SiteStructuredData from '../common/SiteStructuredData';

const Home = () => {
  const features = [
    {
      icon: Wand2,
      title: 'AI-Powered Generation',
      description: 'Transform your written stories into stunning visual storyboards using advanced AI technology.'
    },
    {
      icon: Image,
      title: 'Multiple Art Styles', 
      description: 'Choose from various artistic styles to match your creative vision and story tone.'
    },
    {
      icon: Users,
      title: 'Gallery & Sharing',
      description: 'Share your creations with the community and discover amazing storyboards from other creators.'
    }
  ];

  const stats = [
    { value: '100+', label: 'Stories Visualized' },
    { value: '10+', label: 'Active Creators' },
    { value: '8', label: 'Art Styles' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <SEO 
        title="Scripto - AI-Powered Visual Storytelling Platform"
        description="Transform your stories into stunning visual storyboards with Scripto's advanced AI technology. Create professional storyboards, explore community galleries, and bring your creative vision to life."
        keywords="Scripto, AI storyboard generator, visual storytelling platform, AI art creation, storyboard maker, creative AI tools, digital storytelling"
        url="https://scripto.ayanexus.dev/"
      />
      <SiteStructuredData type="webapp" />
      
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10"></div>
          
          {/* Floating Animation Elements */}
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl opacity-20"
          />
          <motion.div
            animate={{ 
              y: [0, 30, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-20"
          />
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              x: [0, 10, 0]
            }}
            transition={{ 
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl opacity-20"
          />

          <Container maxWidth="7xl" className="relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-stone-900 mb-6 leading-tight">
                Transform Stories into
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block">
                  Visual Storyboards
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
                Harness the power of AI to create stunning visual storyboards from your written stories. 
                Perfect for writers, filmmakers, and creative professionals.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <AuthAwareButton
                to="/try-app"
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="text-lg px-8 py-4"
              >
                Try Scripto
              </AuthAwareButton>
              
              <Link to="/gallery">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  View Examples
                </Button>
              </Link>
            </motion.div>
          </Container>
        </section>

        {/* Quick Stats */}
        <Section background="white" padding="lg">
          <Container maxWidth="6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="space-y-2"
                >
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-stone-900">{stat.value}</h3>
                  <p className="text-xs sm:text-sm md:text-base text-stone-600">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Features Section */}
        <Section background="white" padding="xl">
          <Container maxWidth="6xl" animate>
            <div className="text-center mb-16">
              <IconWrapper
                icon={Sparkles}
                size="lg"
                color="text-blue-600"
                background="bg-blue-100"
                rounded="2xl"
                className="mb-6"
              />
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Scripto?
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to bring your stories to life with professional-quality storyboards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card padding="lg" shadow="md" rounded="xl" hover>
                    <IconWrapper
                      icon={feature.icon}
                      size="md"
                      color="text-purple-600"
                      background="bg-purple-100"
                      rounded="xl"
                      className="mb-4"
                    />
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>

        {/* Call to Action Section */}
        <Section background="gradient" padding="xl">
          <Container maxWidth="4xl" animate>
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Ready to Create Your First Storyboard?
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Join thousands of creators who are already using Scripto to bring their stories to life.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AuthAwareButton
                  to="/try-app"
                  variant="primary"
                  size="lg"
                  icon={Wand2}
                  iconPosition="left"
                  className="text-lg px-8 py-4"
                >
                  Start Creating
                </AuthAwareButton>
                
                <Link to="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-4"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </div>
    </motion.div>
  );
};

export default Home;
