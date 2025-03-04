'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ProfileCharacter from '@/components/ProfileCharacter';

const MemberCard = ({ 
  member, 
  date, 
  officeId, 
  memberInfo,
  status,
  selectedUserData,
  memberStatus
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonMessage, setReasonMessage] = useState('');
  
  const cardRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipTimerRef = useRef(null);
  
  const isCurrentUser = member.id_user === selectedUserData?.id_user;

  const getStatusStyle = () => {
    if (!status?.status_user) return { borderColor: '#E0E0E0' };
    
    switch (status.status_user) {
      case '일등':
      case '출석':
        return { borderColor: '#2196F3' };
      case '지각':
        return { borderColor: '#FF9800' };
      case '결석':
        return { borderColor: '#F44336' };
      default:
        return { borderColor: '#E0E0E0' };
    }
  };

  const formatTimestamp = (timestamp) => {
    const timeStr = timestamp.split('T')[1];
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '일등':
      case '출석':
        return '#2196F3';
      case '지각':
        return '#FF9800';
      case '결석':
        return '#F44336';
      default:
        return '#E0E0E0';
    }
  };

  const getAttendanceOrder = (memberStatus, selectedDate, officeId, userId) => {
    if (!memberStatus[officeId]?.dates[selectedDate]) return '';

    const allMembers = Object.values(memberStatus[officeId].dates[selectedDate].members);
    const attendedMembers = allMembers
      .filter(m => m.status_user === '출석' || m.status_user === '일등' || m.status_user === '지각')
      .sort((a, b) => new Date(a.timestamp_user) - new Date(b.timestamp_user));

    const order = attendedMembers.findIndex(m => m.id_user === userId) + 1;
    return order > 0 ? order.toString() : '';
  };

  const handleCardClick = async () => {
    const memberMessage = memberStatus[officeId]?.dates[date]?.members[member.id_user]?.message_user;
    const isCurrentUser = member.id_user === selectedUserData?.id_user;
    const userStatus = status?.status_user;

    if (isCurrentUser && (userStatus === '지각' || userStatus === '결석')) {
      if (memberMessage) {
        setShowMessageModal(true);
      } else {
        setShowReasonModal(true);
      }
      return;
    }

    if (memberMessage) {
      setShowMessageModal(true);
    }
  };

  const handleReasonSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('event_log')
        .update({ message_event: reasonMessage })
        .eq('id_coffice', officeId.toString())
        .eq('id_user', member.id_user.toString())
        .eq('date_event', date)
        .eq('type_event', status.status_user);

      if (error) throw error;

      const successMessage = document.createElement('div');
      successMessage.className = 'alert alert-success w-[288px] fixed top-[calc(70vh+50px)] left-1/2 -translate-x-1/2 z-50';
      successMessage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>사유서가 제출되었습니다.</span>
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);

      setShowReasonModal(false);
      setReasonMessage('');
    } catch (error) {
      console.error('사유서 제출 실패:', error);
      
      const errorMessage = document.createElement('div');
      errorMessage.className = 'alert alert-error w-[288px] fixed top-[calc(70vh+50px)] left-1/2 -translate-x-1/2 z-50';
      errorMessage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>사유서 제출에 실패했습니다.</span>
      `;
      document.body.appendChild(errorMessage);
      setTimeout(() => errorMessage.remove(), 3000);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <div 
          ref={cardRef} 
          className="shrink-0 flex flex-col items-center w-[25vw] min-w-[90px] max-w-[120px] border-2 rounded-lg shadow-md bg-white overflow-hidden relative"
          style={getStatusStyle()}
          onClick={handleCardClick}
        >
          {/* 출석 뱃지 */}
          {status?.status_user && (
            <div className="absolute right-1 top-1 z-10">
              <div className="badge bg-white shadow-md w-[36px] h-[20px] flex items-center justify-center p-0">
                <span className="text-[11px] font-medium" style={{ color: getStatusColor(status.status_user) }}>
                  {status.status_user}
                </span>
              </div>
            </div>
          )}

          <div className="w-full">
            <div className={`relative -ml-0 -mt-0 ${
              (!status?.status_user || status?.status_user === '결석') ? 'grayscale' : ''
            } ${status?.status_user === '일등' ? 'scale-x-[-1]' : ''}`}>
              <ProfileCharacter
                profileStyle={memberInfo?.profilestyle_user}
                size="100%"
                className={`profile-member-${member.id_user}`}
              />
            </div>
          </div>

          <div className="w-full px-2 pt-[5px] pb-[13px] flex flex-col gap-0">
            <span className="text-[15px] font-semibold text-center text-gray-800 truncate w-full block">
              {memberInfo?.name_user || '사용자'}
            </span>
            <span 
              className={`text-[14px] font-medium flex items-center justify-center ${
                status?.status_user === '지각' ? 'text-orange-500' : 
                (status?.status_user === '출석' || status?.status_user === '일등') ? 'text-blue-500' : 
                'text-gray-500'
              }`}
            >
              {(status?.status_user === '출석' || status?.status_user === '일등' || status?.status_user === '지각') && 
               status.timestamp_user ? 
                formatTimestamp(status.timestamp_user) : 
                '\u00A0'
              }
            </span>
          </div>
        </div>
        
        {/* 출석 순서 뱃지 */}
        {(status?.status_user === '출석' || status?.status_user === '일등' || status?.status_user === '지각') && (
          <div className="mt-[-13px] z-10">
            <div className="w-[24px] h-[24px] rounded-full bg-[#FFFF00] border border-black flex items-center justify-center shadow-md mb-1">
              <span className="text-[14px] font-bold text-black">
                {getAttendanceOrder(memberStatus, date, officeId, member.id_user)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 메시지 모달 */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">메시지</h3>
            <p className="mb-4">{memberStatus[officeId]?.dates[date]?.members[member.id_user]?.message_user}</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setShowMessageModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 사유서 작성 모달 */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">사유서 작성</h3>
            <textarea
              className="w-full h-32 border rounded p-2 mb-4"
              value={reasonMessage}
              onChange={(e) => setReasonMessage(e.target.value)}
              placeholder="사유를 입력해주세요..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowReasonModal(false)}
              >
                취소
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleReasonSubmit}
              >
                제출
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberCard; 