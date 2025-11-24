import React from 'react';

const CreatorsView = () => {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4 text-center text-secondary">Meet the Creators</h1>
      <p className="text-lg text-text mb-12 text-center max-w-2xl">
        We are a team of passionate students from the University of Minnesota dedicated to connecting our community.
      </p>

      {/* Main Contributor */}
      <div className="mb-12 flex flex-col items-center">
        <a href="https://www.linkedin.com/in/ajkn/" target="_blank" rel="noopener noreferrer" className="block bg-card rounded-lg shadow-lg p-6 w-64 text-center transform hover:scale-105 transition-transform duration-300">
          <img src="https://media.licdn.com/dms/image/v2/D4E03AQGT_Ldmt0E6Kw/profile-displayphoto-crop_800_800/B4EZgV.cvDHEAI-/0/1752715349325?e=1765411200&v=beta&t=CxcxaCEJGtOWHlACrRyY0tV8gkQFdzYFHeYqXM7tM88" alt="AJ Kneisl" className="w-32 h-32 rounded-full mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-text">AJ Kneisl</h2>
          <p className="text-text">Project Lead/Lead Developer</p>
        </a>
      </div>

      {/* Other Contributors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <a href="https://www.linkedin.com/in/yordanoseshete/"
           className="block bg-card rounded-lg shadow-lg p-6 w-64 text-center transform hover:scale-105 transition-transform duration-300">
          <img src="https://media.licdn.com/dms/image/v2/D5603AQG7O6l6A-4I9g/profile-displayphoto-scale_400_400/B56Zpfpt44J8Ag-/0/1762541363865?e=1765411200&v=beta&t=LyBxJPH9YxNOSgT02Hrl-xgzXbrAJcfjfJjF_ParZp8" alt="Yordanos Eshete" className="w-32 h-32 rounded-full mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-text">Yordanos Eshete</h3>
          <p className="text-text">Fullstack Developer</p>
        </a>

        <a href="https://www.linkedin.com/in/benjamin-stortroen-b61400347/" target="_blank" rel="noopener noreferrer" className="block bg-card rounded-lg shadow-lg p-6 w-64 text-center transform hover:scale-105 transition-transform duration-300">
          <img src="https://media.licdn.com/dms/image/v2/D4E03AQGixrra3miq3g/profile-displayphoto-shrink_800_800/B4EZR4XfynGgAc-/0/1737186213397?e=1765411200&v=beta&t=V_96vF_0cR1weSo_FR6O3R8B0YvokV4fEh1kdy-UAUY" alt="Ben Strotroen" className="w-32 h-32 rounded-full mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-text">Ben Stortroen</h3>
          <p className="text-text">Fullstack Developer</p>
        </a>

        <a href="https://www.linkedin.com/in/thientri-nguyen/" target="_blank" rel="noopener noreferrer" className="block bg-card rounded-lg shadow-lg p-6 w-64 text-center transform hover:scale-105 transition-transform duration-300">
          <img src="https://media.licdn.com/dms/image/v2/D4E03AQGay0bvqdcevA/profile-displayphoto-crop_800_800/B4EZoAJEUfJ0AI-/0/1760938970089?e=1765411200&v=beta&t=yS6Go62tOjrMKpng-RrOvdWfaJCo2JaKkVkJnqogTZ8" alt="Thien-Tri Nguyen" className="w-32 h-32 rounded-full mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-text">Thien-Tri Nguyen</h3>
          <p className="text-text">Fullstack Developer</p>
        </a>

        <a href="https://www.linkedin.com/in/weste637/" target="_blank" rel="noopener noreferrer" className="block bg-card rounded-lg shadow-lg p-6 w-64 text-center transform hover:scale-105 transition-transform duration-300">
          <img src="https://media.licdn.com/dms/image/v2/D4D03AQFCD2cI2Xre6A/profile-displayphoto-shrink_400_400/B4DZZkHO1HG0Ag-/0/1745436340497?e=1765411200&v=beta&t=zH-Hjuz4XzsjIllWroKNbOkmCo3efvKJnQ3cNo-Z-VY" alt="Josh Westerlund" className="w-32 h-32 rounded-full mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-text">Joshua Westerlund</h3>
          <p className="text-text">Creative Director/UI designer</p>
        </a>
      </div>
    </div>
  );
};

export default CreatorsView;