export const MOCK_USERS = [
  {
    id: 'u1',
    name: 'Felix Zhang',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    role: 'Senior Fullstack Developer',
    skills: ['React', 'TypeScript', 'Node.js'],
    experience: '5 years',
    level: 'Senior',
    bio: 'Building the future of collaboration.'
  },
  {
    id: 'u2',
    name: 'Sarah Miller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'UI/UX Designer',
    skills: ['Figma', 'React Native', 'Tailwind'],
    experience: '3 years',
    level: 'Intermediate',
    bio: 'Design thinker and coffee lover.'
  },
  {
    id: 'u3',
    name: 'James Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    role: 'Backend Engineer',
    skills: ['Go', 'PostgreSQL', 'Docker'],
    experience: '4 years',
    level: 'Senior',
    bio: 'Scalability enthusiast.'
  }
];

export const MOCK_PROJECTS = [
  {
    id: 'p1',
    title: 'EcoTrack: AI Carbon Footprint',
    creator: MOCK_USERS[0], // Current User (Felix)
    thumbnail: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80&w=800',
    skills: ['React', 'Python', 'TensorFlow'],
    description: 'Building a real-time carbon tracking app for small businesses using satellite data and AI.',
    problem: 'Small businesses lack affordable tools to measure their environmental impact.',
    solution: 'An automated dashboard using AI to analyze utility bills and supply chain data.',
    stage: 'Prototype',
    members: ['u2'],
    videoUrl: '#'
  },
  {
    id: 'p2',
    title: 'Nexus: Decentralized Social',
    creator: MOCK_USERS[1],
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800',
    skills: ['Solidity', 'Figma', 'Web3'],
    description: 'A privacy-first social network where users own their data and earn rewards.',
    problem: 'Data privacy concerns in centralized social media.',
    solution: 'Blockchain-based identity and storage.',
    stage: 'Idea',
    members: ['u1'],
    videoUrl: '#'
  },
  {
    id: 'p3',
    title: 'HealthSync: Patient Portal',
    creator: MOCK_USERS[2],
    thumbnail: '', // NO IMAGE
    skills: ['Next.js', 'HIPAA', 'GraphQL'],
    description: 'A secure portal for patients to manage their records and appointments without any media upload.',
    problem: 'Fragmented healthcare data makes it hard for patients to track history.',
    solution: 'Unified dashboard with encrypted storage.',
    stage: 'Building',
    members: [],
    videoUrl: '' // NO VIDEO
  },
  {
    id: 'p4',
    title: 'CodeMentor: Peer Learning',
    creator: MOCK_USERS[0],
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    skills: ['WebRTC', 'Socket.io', 'React'],
    description: 'Real-time pair programming platform for students.',
    problem: 'Learning to code alone is difficult and discouraging.',
    solution: 'Instant matching with peers for live coding sessions.',
    stage: 'MVP',
    members: [],
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  {
    id: 'p5',
    title: 'UrbanGarden: IoT Farming',
    creator: MOCK_USERS[1],
    thumbnail: 'https://images.unsplash.com/photo-1530836361253-efad58bc9b24?auto=format&fit=crop&q=80&w=800',
    skills: ['Arduino', 'C++', 'React Native'],
    description: 'Automated watering and monitoring for city apartments.',
    problem: 'Busy city dwellers struggle to keep plants alive.',
    solution: 'Smart sensors and a mobile app for remote care.',
    stage: 'Idea',
    members: [],
    videoUrl: ''
  }
];

export const MOCK_CHATS = [
  {
    id: 'c1',
    name: 'EcoTrack Team',
    lastMsg: 'Felix: I just pushed the new API...',
    time: '2m',
    unread: 3,
    isGroup: true,
    messages: [
      { id: 'm1', sender: 'Felix', text: 'Hey team, check the new API docs.', time: '10:00 AM' },
      { id: 'm2', sender: 'Sarah', text: 'Looks good! I will start on the UI.', time: '10:05 AM' }
    ]
  },
  {
    id: 'c2',
    name: 'Sarah Miller',
    lastMsg: 'The designs look amazing!',
    time: '1h',
    unread: 0,
    isGroup: false,
    messages: [
      { id: 'm3', sender: 'Sarah', text: 'The designs look amazing!', time: '09:00 AM' }
    ]
  }
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'request', user: 'Sarah Miller', content: 'requested to join EcoTrack', time: '2m ago' },
  { id: 'n2', type: 'message', user: 'James Wilson', content: 'sent you a message', time: '1h ago' }
];

export const MOCK_JOIN_REQUESTS = [
  {
    id: 'req_sim_1',
    projectId: 'p1',
    projectTitle: 'EcoTrack: AI Carbon Footprint',
    userId: 'u3',
    userName: 'James Wilson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    reason: 'I have extensive experience with backend scaling and would love to help with the data processing pipeline.',
    skills: 'Go, PostgreSQL, Docker',
    status: 'pending',
    timestamp: new Date().toISOString()
  }
];