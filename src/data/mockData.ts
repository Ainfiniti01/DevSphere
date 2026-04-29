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
  }
];

export const MOCK_PROJECTS = [
  {
    id: 'p1',
    title: 'EcoTrack: AI Carbon Footprint',
    creator: MOCK_USERS[0],
    thumbnail: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80&w=800',
    skills: ['React', 'Python', 'TensorFlow'],
    description: 'Building a real-time carbon tracking app for small businesses using satellite data and AI.',
    problem: 'Small businesses lack affordable tools to measure their environmental impact.',
    solution: 'An automated dashboard using AI to analyze utility bills and supply chain data.',
    stage: 'Prototype',
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
    videoUrl: '#'
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