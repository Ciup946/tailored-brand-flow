
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hero from '@/components/Hero';
import PurposeInput from '@/components/PurposeInput';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';
import { getProfileByUrlParam } from '@/services/urlParamService';
import { getHomePageSettingsByUrlParam, DEFAULT_HOME_PAGE_SETTINGS } from '@/services/homePageService';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const { urlParam } = useParams();
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [homePageSettings, setHomePageSettings] = useState<any>(DEFAULT_HOME_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (urlParam) {
        try {
          console.log(`Fetching profile for URL parameter: ${urlParam}`);
          const profile = await getProfileByUrlParam(urlParam);
          
          if (!profile) {
            console.log(`No profile found for URL parameter: ${urlParam}`);
            setProfileNotFound(true);
            toast.error(`The page for /${urlParam} does not exist.`);
          } else {
            console.log(`Profile found for ${urlParam}:`, profile);
            setOwnerProfile(profile);
            
            // Fetch home page settings for this URL parameter
            const settings = await getHomePageSettingsByUrlParam(urlParam);
            if (settings) {
              setHomePageSettings(settings);
            }
            
            setProfileNotFound(false);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfileNotFound(true);
          toast.error(`Could not load page for /${urlParam}. Please check if this page exists.`);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [urlParam]);
  
  const handlePurposeSubmit = (purpose: string) => {
    // Prevent search if profile not found for URL parameter routes
    if (urlParam && profileNotFound) {
      toast.error(`Cannot search - the page for /${urlParam} does not exist.`);
      return;
    }
    
    // When we're on a custom URL parameter page, navigate to that user's vista page
    if (urlParam) {
      navigate(`/${urlParam}/vista?search=${encodeURIComponent(purpose)}`);
    } else {
      // Default behavior - navigate to the global vista page
      navigate(`/vista?search=${encodeURIComponent(purpose)}`);
    }
  };
  
  const scrollToInput = () => {
    const element = document.getElementById('purpose-input');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      // Calculate progress (0 to 1) based on scroll position
      const progress = Math.min(Math.max(scrollY / viewportHeight, 0), 1);
      setScrollProgress(progress);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial call to set initial state
    handleScroll();
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Show loading state only briefly while checking URL parameter
  if (loading && urlParam) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Show error state for non-existent URL parameter profiles
  if (urlParam && profileNotFound) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-4">The page for /{urlParam} does not exist.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-beige-50">
      <Toaster />
      {/* <Header /> */}
      
      {/* Use a fixed positioned container for the Hero */}
      <div className="fixed inset-0 z-0">
        <Hero 
          scrollToInput={scrollToInput} 
          scrollProgress={scrollProgress}
          customTitle={homePageSettings.heroTitle}
          customSubtitle={homePageSettings.heroSubtitle}
          customDescription={homePageSettings.heroDescription}
        />
      </div>
      
      {/* Add a container for the PurposeInput with proper z-index */}
      <div className="relative z-10">
        {/* Add spacer to push PurposeInput down one viewport height */}
        <div className="h-screen"></div>
        
        <PurposeInput 
          onPurposeSubmit={handlePurposeSubmit} 
          scrollProgress={scrollProgress}
          placeholder={homePageSettings.customInputPlaceholder || `Search ${urlParam || ''}'s content...`}
          interactiveTitle={homePageSettings.interactiveTitle}
          interactiveSubtitle={homePageSettings.interactiveSubtitle}
          submitButtonText={homePageSettings.submitButtonText}
          optionButtons={homePageSettings.optionButtons}
        />
      </div>
      
      {/* Footer with proper z-index to appear after PurposeInput */}
      <div className="relative z-10">
        <Footer 
          userLanguage={ownerProfile?.default_language} 
          supportedLanguages={ownerProfile?.supported_ai_languages}
          customName={homePageSettings.footerName}
        />
      </div>
    </div>
  );
};

export default Index;
