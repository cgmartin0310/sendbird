import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { SendbirdProvider } from '@sendbird/uikit-react/SendbirdProvider';
import ChannelList from '@sendbird/uikit-react/ChannelList';
import Channel from '@sendbird/uikit-react/Channel';
import ChannelSettings from '@sendbird/uikit-react/ChannelSettings';
import '@sendbird/uikit-react/dist/index.css';
import './Chat.css';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { channelUrl } = useParams<{ channelUrl: string }>();
  const [currentChannelUrl, setCurrentChannelUrl] = useState<string | undefined>(channelUrl);
  const [showSettings, setShowSettings] = useState(false);

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
        {currentChannelUrl && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
              />
            </svg>
            {showSettings ? 'Hide' : 'Show'} Members
          </button>
        )}
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
                    setShowSettings(false); // Hide settings when switching channels
                  }
                }}
                activeChannelUrl={currentChannelUrl}
              />
            </div>
            <div style={{ flex: 1, display: 'flex' }}>
              {currentChannelUrl ? (
                <>
                  <div style={{ flex: 1 }}>
                    <Channel 
                      channelUrl={currentChannelUrl}
                      onChatHeaderActionClick={() => {
                        setShowSettings(!showSettings);
                      }}
                      renderChannelHeader={() => (
                        <div className="sendbird-channel-header px-4 py-3 border-b flex items-center justify-between bg-white">
                          <div>
                            <h3 className="font-medium text-gray-900">Current Conversation</h3>
                            <p className="text-sm text-gray-500">Click "Show Members" to see all participants</p>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                  {showSettings && (
                    <div style={{ width: '320px', borderLeft: '1px solid #e0e0e0', overflowY: 'auto' }}>
                      <div className="p-4 border-b bg-gray-50">
                        <h3 className="font-medium text-gray-900">Channel Members</h3>
                      </div>
                      <ChannelSettings
                        channelUrl={currentChannelUrl}
                        onCloseClick={() => setShowSettings(false)}
                        renderChannelProfile={() => <div />} // Hide channel profile section
                        renderLeaveChannel={() => <div />} // Hide leave channel button
                      />
                    </div>
                  )}
                </>
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