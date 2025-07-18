// import { useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import Header from '../components/common/Header';
// import Footer from '../components/common/Footer';
// import ChatPanel from '../components/features/ChatPanel';

// const ChatPage = () => {
//   const { user } = useContext(AuthContext);

//   return (
//     <div className="min-h-screen flex flex-col">
//       <Header />
//       <main className="flex-grow p-4 flex flex-col md:flex-row gap-4">
//         <ChatPanel title={`User: ${user?.username || 'You'}`} isUser={true} />
//         <ChatPanel title="Mentor" isUser={false} />
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default ChatPage;

// ChatPage.jsx
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ChatPanel from '../components/features/ChatPanel';

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('http://localhost:5000/api/messages', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(response.data);
      } catch (err) {
        setError('Failed to load messages');
      }
    };
    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4 flex flex-col md:flex-row gap-4">
        <ChatPanel
          title={`User: ${user?.username || 'You'}`}
          isUser={true}
          messages={messages}
          setMessages={setMessages}
        />
        <ChatPanel
          title="Mentor"
          isUser={false}
          messages={messages}
          setMessages={setMessages}
        />
      </main>
      <Footer />
    </div>
  );
};

export default ChatPage;
