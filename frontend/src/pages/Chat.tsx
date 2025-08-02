import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SendbirdApp from '@sendbird/uikit-react/App';
import '@sendbird/uikit-react/dist/index.css';

const Chat = () => {
  const { channelUrl } = useParams<{ channelUrl: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get Sendbird App ID from environment variable
  const appId = import.meta.env.VITE_SENDBIRD_APP_ID;

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

  if (!user?.id || !channelUrl) {
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
      <div className="flex-1">
        <SendbirdApp
          appId={appId}
          userId={userId}
          nickname={nickname}
          theme="light"
          channelUrl={channelUrl}
          showSearchIcon={false}
          replyType="QUOTE_REPLY"
          messageListParams={{
            prevResultSize: 20,
            includeReactions: true,
            includeMetaArray: true,
          }}
        />
      </div>
    </div>
  );
};

export default Chat;
