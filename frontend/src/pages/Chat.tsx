import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { SendbirdProvider } from '@sendbird/uikit-react/SendbirdProvider';
import ChannelList from '@sendbird/uikit-react/ChannelList';
import Channel from '@sendbird/uikit-react/Channel';
import '@sendbird/uikit-react/dist/index.css';
import './Chat.css';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { channelUrl } = useParams<{ channelUrl: string }>();
  const [currentChannelUrl, setCurrentChannelUrl] = useState<string | undefined>(channelUrl);

  // Get Sendbird App ID from environment variable
  const appId = import.meta.env.VITE_SENDBIRD_APP_ID;

  // Update current channel when URL changes
  useEffect(() => {
    if (channelUrl) {
      setCurrentChannelUrl(channelUrl);
    }
  }, [channelUrl]);

  if (!appId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Sendbird App ID is not configured. Please add VITE_SENDBIRD_APP_ID to your .env file.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return <div>Loading...</div>;
  }

  // Use the user's ID as the Sendbird user ID
  const userId = `user_${user.id}`;
  const nickname = `${user.firstName} ${user.lastName}`;

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/conversations')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Conversations
        </button>
        <h2 className="text-lg font-medium text-gray-900">Chat</h2>
      </div>
      <div className="flex-1 sendbird-chat-container">
        <SendbirdProvider 
          appId={appId} 
          userId={userId} 
          nickname={nickname}
        >
          <div className="sendbird-app-wrapper" style={{ height: '100%', display: 'flex' }}>
            <div style={{ width: '320px', borderRight: '1px solid #e0e0e0' }}>
              <ChannelList 
                onChannelSelect={(channel: any) => {
                  if (channel) {
                    setCurrentChannelUrl(channel.url);
                  }
                }}
                activeChannelUrl={currentChannelUrl}
              />
            </div>
            <div style={{ flex: 1 }}>
              {currentChannelUrl ? (
                <Channel 
                  channelUrl={currentChannelUrl}
                  onChatHeaderActionClick={() => {
                    // Optional: Handle header actions
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a conversation to start chatting
                </div>
              )}
            </div>
          </div>
        </SendbirdProvider>
      </div>
    </div>
  );
};

export default Chat;