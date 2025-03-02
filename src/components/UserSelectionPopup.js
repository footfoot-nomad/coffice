export default function UserSelectionPopup({ userInfoList, onSelectUser }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">사용자 정보 선택</h2>
        <div className="space-y-2">
          {userInfoList?.map((user) => (
            <button
              key={`user-${user.email}-${user.time}`}
              onClick={() => onSelectUser(user)}
              className="w-full p-3 text-left border rounded-sm hover:bg-gray-100 transition-colors"
            >
              <div className="font-medium">{user.email}</div>
              <div className="text-sm text-gray-600">
                위치: {user.lat}, {user.lon}
              </div>
              <div className="text-sm text-gray-600">
                시간: {new Date(user.time).toLocaleString('ko-KR')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}