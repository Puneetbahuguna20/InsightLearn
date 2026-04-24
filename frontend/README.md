# VisualLearn Frontend

A modern React application for AI-powered educational content generation and visualization.

## Features

- **AI-Powered Content Generation**: Automatically classify topics and generate educational content
- **Interactive Visualizations**: Clickable regions on diagrams for enhanced learning
- **Multiple Content Types**: Support for structures, processes, algorithms, hierarchies, and comparisons
- **Step-by-Step Navigation**: For process and algorithm content with auto-play functionality
- **Real-time Search**: Advanced filtering and sorting capabilities
- **Responsive Design**: Mobile-first approach with beautiful animations
- **State Management**: Zustand for efficient state handling

## Technology Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icon library
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AlgorithmRenderer.jsx
│   │   ├── ComparisonRenderer.jsx
│   │   ├── ContentRenderer.jsx
│   │   ├── HierarchyRenderer.jsx
│   │   ├── InteractiveImage.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Navbar.jsx
│   │   ├── NotificationContainer.jsx
│   │   ├── ProcessRenderer.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StructureRenderer.jsx
│   │   ├── TopicCard.jsx
│   │   └── TopicInput.jsx
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   │   ├── ContentPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── SearchPage.jsx
│   │   └── TopicPage.jsx
│   ├── services/           # API and external services
│   │   └── api.js
│   ├── stores/             # Zustand state stores
│   │   ├── topicStore.js
│   │   └── uiStore.js
│   ├── styles/            # Global styles and utilities
│   ├── utils/             # Helper functions
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Add your backend API URL to VITE_API_URL
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Key Components

### Content Renderers
- **ProcessRenderer**: Step-by-step content with navigation and auto-play
- **AlgorithmRenderer**: Algorithm steps with code examples and complexity analysis
- **StructureRenderer**: Interactive labeled diagrams with clickable regions
- **HierarchyRenderer**: Tree structures with multiple view modes
- **ComparisonRenderer**: Side-by-side and table comparisons

### State Management
- **topicStore**: Handles topic classification, content generation, and navigation
- **uiStore**: Manages UI state, notifications, and user preferences

### Features
- Real-time topic classification
- Multi-format content generation
- Interactive image regions
- Progress tracking for processes/algorithms
- Advanced search and filtering
- Responsive design
- Smooth animations and transitions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
