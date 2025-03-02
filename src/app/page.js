'use client'

import { useState, useEffect, useRef } from 'react'
import UserSelectionPopup from '@/components/UserSelectionPopup'
import { userInfoList } from '@/data/userInfoList'
import { supabase } from '@/lib/supabase'
import ProfileEditModal from '@/components/ProfileEditModal'
import ProfileCharacter from '@/components/ProfileCharacter'
import React from 'react'

// getDatesForMonth 함수를 handleSelectUser 함수 전에 정의
const getDatesForMonth = (yearMonth, dayOfWeek) => {
  const year = 2000 + parseInt(yearMonth.substring(0, 2));
  const month = parseInt(yearMonth.substring(2, 4)) - 1; // 0-based month
  const dates = [];
  
  // 요일 매핑
  const dayMapping = {
    '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0
  };
  
  const targetDay = dayMapping[dayOfWeek];
  const date = new Date(year, month, 1);
  
  // 해당 월의 마지막 날짜
  const lastDay = new Date(year, month + 1, 0).getDate();
  
  // 해당 월의 모든 날짜를 확인
  for (let i = 1; i <= lastDay; i++) {
    date.setDate(i);
    if (date.getDay() === targetDay) {
      // YYYY-MM-DD 형식으로 변환
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      dates.push(formattedDate);
    }
  }
  
  return dates;
};

// Timer 컴포넌트 수정
const Timer = ({ selectedSubscription, officeInfo, selectedDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerStatus, setTimerStatus] = useState('waiting');
  const [isExactToday, setIsExactToday] = useState(false);  // isExactToday 상태 추가

  useEffect(() => {
    if (!selectedSubscription || !officeInfo) return;

    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // 시간 초기화

    // 선택된 날짜 - selectedDate prop 사용
    const selectedDateObj = new Date(selectedDate); // selectedSubscription.dates[0].date 대신 selectedDate 사용
    selectedDateObj.setHours(0, 0, 0, 0);  // 시간 초기화

    // 정확히 오늘 날짜인지 확인
    const isExactToday = today.getTime() === selectedDateObj.getTime();
    setIsExactToday(isExactToday);
    
    // isExactToday 값을 콘솔에 출력
    console.log('isExactToday:', isExactToday, {
      today: today.toISOString(),
      selectedDate: selectedDateObj.toISOString()
    });

    // 정확히 오늘 날짜가 아니면 타이머를 실행하지 않음
    if (!isExactToday) {
      setTimeLeft(null);
      return;
    }

    const dayMapping = {
      '월': 'mon_operation_office',
      '화': 'tue_operation_office',
      '수': 'wed_operation_office',
      '목': 'thu_operation_office',
      '금': 'fri_operation_office',
      '토': 'sat_operation_office',
      '일': 'sun_operation_office'
    };

    const calculateTimes = () => {
      const now = new Date();
      const operationHours = officeInfo[selectedSubscription.id_office]?.[dayMapping[selectedSubscription.day_coffice]];
      console.log('operationHours', operationHours);

      if (!operationHours) return null;

      // 영업 시작 시간
      const [startHour, startMinute] = operationHours[0].split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(startHour, startMinute, 0);

      // 출석 마감 시간
      const [attendHour, attendMinute] = selectedSubscription.attendtime_coffice.split(':').map(Number);
      const attendTime = new Date();
      attendTime.setHours(attendHour, attendMinute, 0);
      

      // 총 카운트다운 시간 (영업 시작 ~ 출석 마감)
      const totalCountdownTime = attendTime - startTime;
      console.log('totalCountdownTime', totalCountdownTime);

      // 현재 상태에 따른 남은 시간 계산
      if (now < startTime) {
        // 영업 시작 전: 총 카운트다운 시간 표시
        setTimerStatus('waiting');
        return totalCountdownTime;
      } else if (now < attendTime) {
        // 출석 가능 시간: 카운트다운 진행
        setTimerStatus('counting');
        return attendTime - now;
      } else {
        // 출석 마감 후
        setTimerStatus('ended');
        return 0;
      }
    };

    const timer = setInterval(() => {
      const remainingTime = calculateTimes();
      setTimeLeft(remainingTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSubscription, officeInfo, selectedDate]);

  const formatTime = (ms) => {
    if (!isExactToday) return { hours: '--', minutes: '--', seconds: '--' };  // isExactToday가 false일 때 처리
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return {
      hours: String(Math.max(0, hours)).padStart(2, '0'),
      minutes: String(Math.max(0, minutes)).padStart(2, '0'),
      seconds: String(Math.max(0, seconds)).padStart(2, '0')
    };
  };

  const time = formatTime(timeLeft || 0);

  return (
    <div className="flex flex-col items-start">
      <div className="text-[20px] font-semibold text-gray-800 mb-3 px-4">
        남은 시간
      </div>
      <div className="border-2 border-gray-300 bg-gray-100 rounded-lg p-3 w-full max-w-[320px] mx-auto">
        <div className="flex justify-center items-center">
          <span className="font-mono text-[25px] text-black">
            {`${time.hours} : ${time.minutes} : ${time.seconds}`}
          </span>
        </div>
      </div>
      <div className="w-full h-[1px] bg-gray-200 mt-8"></div>
    </div>
  );
};

// ProfileCharacter를 메모이제이션
const MemoizedProfileCharacter = React.memo(ProfileCharacter);

// MemberCard 컴포넌트 최적화 (memo 제거)
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
  const cardRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipTimerRef = useRef(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonMessage, setReasonMessage] = useState('');
  
  // 현재 사용자 여부 확인
  const isCurrentUser = member.id_user === selectedUserData?.id_user;

  // 상태 스타일 가져오기
  const getStatusStyle = () => {
    if (!status?.status_user) return { borderColor: '#E0E0E0' };
    
    switch (status.status_user) {
      case '일등':
      case '출석':
        return { borderColor: '#2196F3' }; // 파란색
      case '지각':
        return { borderColor: '#FF9800' }; // 오렌지색
      case '결석':
        return { borderColor: '#F44336' }; // 빨간색
      default:
        return { borderColor: '#E0E0E0' }; // 기본 회색
    }
  };

  // 타임스탬프 포맷팅
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // 길게 누르기 시작
  const handleTouchStart = () => {
    if (!isCurrentUser) return;
    
    const timer = setTimeout(() => {
      setIsEditing(true);
      setEditMessage('');
      setShowTooltip(true);
    }, 500);
    
    setLongPressTimer(timer);
  };

  // 길게 누르기 취소
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 상태에 따른 색상을 반환하는 함수 추가
  const getStatusColor = (status) => {
    switch (status) {
      case '일등':
      case '출석':
        return '#2196F3'; // 파란색
      case '지각':
        return '#FF9800'; // 오렌지색
      case '결석':
        return '#F44336'; // 빨간색
      default:
        return '#E0E0E0'; // 기본 회색
    }
  };

  // MemberCard 컴포넌트 내부에서 사용할 getAttendanceOrder 함수 추가
  const getAttendanceOrder = (memberStatus, selectedDate, officeId, userId) => {
    if (!memberStatus[officeId]?.dates[selectedDate]) return '';

    const allMembers = Object.values(memberStatus[officeId].dates[selectedDate].members);
    const attendedMembers = allMembers
      .filter(m => m.status_user === '출석' || m.status_user === '일등' || m.status_user === '지각')
      .sort((a, b) => new Date(a.timestamp_user) - new Date(b.timestamp_user));

    const order = attendedMembers.findIndex(m => m.id_user === userId) + 1;
    return order > 0 ? order.toString() : '';
  };

  // 카드 클릭 핸들러 수정
  const handleCardClick = async () => {
    const memberMessage = memberStatus[officeId]?.dates[date]?.members[member.id_user]?.message_user;
    const isCurrentUser = member.id_user === selectedUserData?.id_user;
    const userStatus = status?.status_user;

    // 현재 사용자이고 지각/결석인 경우
    if (isCurrentUser && (userStatus === '지각' || userStatus === '결석')) {
      if (memberMessage) {
        // 이미 사유서가 있는 경우 메시지 모달 표시
        setShowMessageModal(true);
      } else {
        // 사유서가 없는 경우 사유서 작성 모달 표시
        setShowReasonModal(true);
      }
      return;
    }

    // 다른 사용자의 메시지 표시
    if (memberMessage) {
      setShowMessageModal(true);
    }
  };

  // 사유서 제출 핸들러
  const handleReasonSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('event_log')
        .insert([
          {
            id_coffice: officeId,
            id_user: member.id_user,
            type_event: status.status_user, // '지각' 또는 '결석'
            message_event: reasonMessage,
            date_event: date,
            timestamp_event: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      // 성공 메시지 표시
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
      
      // 에러 메시지 표시
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
      {/* 메시지 모달 - 수정 버튼 추가 */}
      {showMessageModal && memberStatus[officeId]?.dates[date]?.members[member.id_user]?.message_user && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
          onClick={() => setShowMessageModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-[300px] max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-[40px] h-[40px] rounded-full overflow-hidden border border-gray-200">
                  <ProfileCharacter
                    profileStyle={memberInfo?.profilestyle_user}
                    size={40}
                  />
                </div>
                <span className="text-lg font-bold text-gray-800">
                  {memberInfo?.name_user || '사용자'}
                </span>
              </div>
              {/* 현재 사용자이고 지각/결석인 경우에만 수정 버튼 표시 */}
              {member.id_user === selectedUserData?.id_user && 
               (status?.status_user === '지각' || status?.status_user === '결석') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMessageModal(false);
                    setReasonMessage(memberStatus[officeId]?.dates[date]?.members[member.id_user]?.message_user || '');
                    setShowReasonModal(true);
                  }}
                  className="px-3 py-1 text-sm bg-[#FFFF00] text-black border-1 border-black rounded-lg"
                >
                  수정
                </button>
              )}
            </div>
            <p className="text-gray-600 text-base break-words whitespace-pre-line">
              {memberStatus[officeId]?.dates[date]?.members[member.id_user]?.message_user}
            </p>
          </div>
        </div>
      )}
      
      {/* 툴크 */}
      {showTooltip && ((status?.message_user && !isEditing) || isEditing) && (
        <div 
          ref={tooltipRef}
          className="fixed z-9999 transition-opacity duration-200"
          style={{
            left: cardRef.current ? `${cardRef.current.getBoundingClientRect().left + (cardRef.current.offsetWidth / 2)}px` : '0',
            top: cardRef.current ? `${cardRef.current.getBoundingClientRect().top - 10}px` : '0',
            transform: 'translate(-50%, -100%)',
            opacity: showTooltip ? 1 : 0
          }}
        >
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm w-[120px]">
            {isEditing ? (
              <input
                type="text"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    updateMessage();
                  }
                }}
                className="w-full px-2 py-1 text-black rounded-sm"
                maxLength={20}
                placeholder="새 메시지"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="text-center">
                {status.message_user}
              </div>
            )}
            <div className="absolute w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800 bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[6px]" />
          </div>
        </div>
      )}
      
      {/* 사유서 작성 모달 */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div 
            className="bg-white rounded-2xl p-6 w-[300px] max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              {status.status_user === '지각' ? '지각 사유서' : '결석 사유서'} 작성
            </h3>
            <textarea
              value={reasonMessage}
              onChange={(e) => setReasonMessage(e.target.value)}
              placeholder={`${status.status_user === '지각' ? '지각' : '결석'} 사유를 입력해주세요.`}
              className="w-full border rounded-xl px-4 py-3 text-base text-gray-800"
              rows={3}
              maxLength={100}
            />
            <p className="text-sm text-gray-500 mt-2">
              최대 100자까지 입력 가능합니다. ({reasonMessage.length}/100)
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setReasonMessage('');
                }}
                className="flex-1 btn btn-outline text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleReasonSubmit}
                disabled={!reasonMessage.trim()}
                className="flex-1 btn bg-[#FFFF00] hover:bg-[#FFFF00] text-black border-1 border-black shadow-none"
              >
                제출
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 카드 본체 */}
      <div 
        className="relative cursor-pointer" 
        onClick={handleCardClick}
      >
        {/* 출석 순서 뱃지 */}
        {(status?.status_user === '출석' || status?.status_user === '일등' || status?.status_user === '지각') && (
          <div className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 z-10">
            <div className="w-[24px] h-[24px] rounded-full bg-[#FFFF00] border border-black flex items-center justify-center shadow-xs">
              <span className="text-[14px] font-bold text-black">
                {getAttendanceOrder(memberStatus, date, officeId, member.id_user)}
              </span>
            </div>
          </div>
        )}
        <div ref={cardRef} className="shrink-0 flex flex-col items-center w-[100px] sm:w-[120px] md:w-[140px] border-2 border-gray-600 rounded-lg shadow-xs bg-white overflow-hidden">
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
              <MemoizedProfileCharacter
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
      </div>
    </>
  );
};

// Haversine 거리 계산 함수 추가 (상단에 추가)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // 지구의 반지름 (미터)
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // 미터 단위 거리
};

export default function Home() {
  const [showPopup, setShowPopup] = useState(true)
  const [selectedUserData, setSelectedUserData] = useState(null)
  const [userData, setUserData] = useState(null)
  const [subscriptionDetails, setSubscriptionDetails] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const dropdownRef = useRef(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [officeInfo, setOfficeInfo] = useState(null)
  const [membersInfo, setMembersInfo] = useState({})
  const [eventLog, setEventLog] = useState(null)
  const [memberStatus, setMemberStatus] = useState({})
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)
  const [timerStatus, setTimerStatus] = useState('waiting'); // 'waiting', 'counting', 'ended'
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [cofficeMessage, setCofficeMessage] = useState('오늘도 함께 코피스~');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isMessageSelected, setIsMessageSelected] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [memberInfo, setMemberInfo] = useState([])
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 요일을 숫자로 변환하는 함수 (일요일: 0 ~ 토요일: 6)
  const getDayNumber = (day) => {
    const days = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 }
    return days[day]
  }

  // 현재 요일부터 목표 요일까지의 차이를 계산하는 함수
  const getDayDifference = (currentDay, targetDay) => {
    const current = getDayNumber(currentDay)
    const target = getDayNumber(targetDay)
    return (target - current + 7) % 7
  }

  // 날짜 비교를 위한 유틸리티 함수 수정
  const compareDates = (date1, date2) => {
    const d1 = new Date(date1)
    const d2 = new Date() // 현재 시간 사용
    d1.setHours(0, 0, 0, 0)
    d2.setHours(0, 0, 0, 0)
    return d1.getTime() - d2.getTime()
  }

  // 가장 가까운 미래 날짜 찾기
  useEffect(() => {
    if (selectedSubscription && userData) {
      const today = new Date(userData.timestamp)
      const futureDates = selectedSubscription.dates
        .filter(date => compareDates(date.date, today) >= 0)
        .sort((a, b) => compareDates(a.date, b.date))

      if (futureDates.length > 0) {
        setSelectedDate(futureDates[0].date)
      } else {
        // 미래 날짜가 없는 경우 가장 마지막 날짜 선택
        const lastDate = selectedSubscription.dates[selectedSubscription.dates.length - 1].date
        setSelectedDate(lastDate)
      }
    }
  }, [selectedSubscription, userData])

  // 초기 event_log 데이터 로드 및 memberStatus 설정
  useEffect(() => {
    if (!subscriptionInfo) return;

    const cofficeIds = subscriptionInfo.map(sub => sub.id_coffice);

    const initializeMemberStatus = async () => {
      try {
        // event_log 데이터 조회
        const { data: eventLogData, error } = await supabase
          .from('event_log')
          .select('*')
          .in('id_coffice', cofficeIds);

        if (error) {
          console.error('이벤트 로그 조회 실패:', error);
          return;
        }

        console.log('초기 이벤트 로그 데이터 로드:', eventLogData);

        // memberStatus 객체 초기화
        const newMemberStatus = {};

        // 기본 구조 생성
        subscriptionInfo.forEach(subscription => {
          const officeId = subscription.id_coffice;
          newMemberStatus[officeId] = {
            dates: {}
          };

          subscription.dates.forEach(dateInfo => {
            newMemberStatus[officeId].dates[dateInfo.date] = {
              members: {}
            };

            // 각 멤버의 기본 상태 설정
            dateInfo.members.forEach(member => {
              newMemberStatus[officeId].dates[dateInfo.date].members[member.id_user] = {
                id_user: member.id_user,
                message_user: null,
                status_user: null
              };
            });
          });
        });

        // eventLog로 상태 업데이트
        eventLogData.forEach(event => {
          const officeId = event.id_coffice;
          const eventDate = event.date_event;
          const userId = event.id_user;

          // 해당 날짜의 이전 이벤트가 있는지 확인
          const currentStatus = newMemberStatus[officeId]?.dates[eventDate]?.members[userId];
          
          if (currentStatus) {
            // 타임스탬프를 비교하여 최신 이벤트만 적용
            const currentTimestamp = currentStatus.timestamp_user ? new Date(currentStatus.timestamp_user) : new Date(0);
            const newTimestamp = new Date(event.timestamp_event);

            if (newTimestamp > currentTimestamp) {
              newMemberStatus[officeId].dates[eventDate].members[userId] = {
                id_user: userId,
                status_user: event.type_event,
                message_user: event.message_event,
                timestamp_user: event.timestamp_event
              };
            }
          }
        });

        // memberStatus 업데이트
        setMemberStatus(newMemberStatus);


        // eventLog state 업데이트
        setEventLog(eventLogData);

      } catch (error) {
        console.error('멤버 상태 초기화 실패:', error);
      }
    };

    initializeMemberStatus();
  }, [subscriptionInfo]);

  // eventLog 변경 시 memberStatus 업데이트를 위한 useEffect
  useEffect(() => {
    if (!eventLog || !subscriptionInfo) return;

    console.group('memberStatus 업데이트 시작');
    console.log('eventLog 데이터:', eventLog);

    try {
      // memberStatus 객체 초기화
      const newMemberStatus = {};

      // 기본 구조 생성
      subscriptionInfo.forEach(subscription => {
        const officeId = subscription.id_coffice;
        newMemberStatus[officeId] = { dates: {} };

        subscription.dates.forEach(dateInfo => {
          const date = dateInfo.date;
          newMemberStatus[officeId].dates[date] = { members: {} };

          // 각 멤버의 기본 상태 설정 (status_user 제외)
          dateInfo.members.forEach(member => {
            newMemberStatus[officeId].dates[date].members[member.id_user] = {
              id_user: member.id_user,
              message_user: null,
              timestamp_user: null
            };
          });
        });
      });

      // eventLog로 상태 업데이트
      eventLog.forEach(event => {
        const officeId = event.id_coffice;
        const eventDate = event.date_event;
        const userId = event.id_user;

        // 해당 날짜와 멤버가 존재하는지 확인
        if (newMemberStatus[officeId]?.dates[eventDate]?.members[userId]) {
          const currentStatus = newMemberStatus[officeId].dates[eventDate].members[userId];
          const currentTimestamp = currentStatus.timestamp_user 
            ? new Date(currentStatus.timestamp_user) 
            : new Date(0);
          const newTimestamp = new Date(event.timestamp_event);

          // 최신 이벤트인 경우에만 업데이트
          if (newTimestamp > currentTimestamp) {
            newMemberStatus[officeId].dates[eventDate].members[userId] = {
              id_user: userId,
              status_user: event.type_event,
              message_user: event.message_event,
              timestamp_user: event.timestamp_event
            };

            console.log('멤버 상태 업데이트:', {
              officeId,
              date: eventDate,
              userId,
              newStatus: event.type_event,
              timestamp: event.timestamp_event
            });
          }
        }
      });

      console.log('새로운 memberStatus:', newMemberStatus);
      setMemberStatus(newMemberStatus);

    } catch (error) {
      console.error('memberStatus 업데이트 중 오류:', error);
    }

    console.groupEnd();
  }, [eventLog, subscriptionInfo]);

  // memberStatus 변경 감지를 위한 useEffect 추가
  useEffect(() => {
    console.log('memberStatus 변경됨:', memberStatus);
  }, [memberStatus]);

  // Supabase 실시간 구독 설정
  useEffect(() => {
    if (!subscriptionInfo) return;

    const cofficeIds = subscriptionInfo.map(sub => sub.id_coffice);
    
    const subscription = supabase
      .channel('event_log_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'event_log',
          filter: `id_coffice=in.(${cofficeIds.join(',')})` 
        },
        async (payload) => {
          console.group('📡 실시간 이벤트 감지');
          console.log('이벤트 타입:', payload.eventType);
          console.log('데이터:', payload.new || payload.old);

          // 현재 eventLog 가져오기
          let updatedEventLog = [...(eventLog || [])];

          switch (payload.eventType) {
            case 'INSERT':
              updatedEventLog = [...updatedEventLog, payload.new];
              break;
            case 'UPDATE':
              updatedEventLog = updatedEventLog.map(log => 
                log.id_event === payload.new.id_event ? payload.new : log
              );
              break;
            case 'DELETE':
              updatedEventLog = updatedEventLog.filter(log => 
                log.id_event !== payload.old.id_event
              );
              break;
          }

          console.log('업데이트된 eventLog:', updatedEventLog);
          setEventLog(updatedEventLog);
          console.groupEnd();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [subscriptionInfo, eventLog]);

  // 출석 버튼 상태 관리
  useEffect(() => {
    if (!selectedSubscription || !officeInfo || !selectedDate) return;

    const checkAttendanceStatus = () => {
      const now = new Date();
      const selectedDateObj = new Date(selectedDate);
      
      // 날짜 비교를 위해 시간을 00:00:00으로 설정
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDateObj.setHours(0, 0, 0, 0);

      // 현재 사용자의 출석 상태 확인
      const currentStatus = memberStatus[selectedSubscription.id_coffice]
        ?.dates[selectedDate]
        ?.members[selectedUserData.id_user]
        ?.status_user;

      // 이미 출석했거나 일등인 경우 버튼 비활성화
      if (currentStatus === '출석' || currentStatus === '일등') {
        setAttendanceMessage('출석 완료');
        setIsButtonDisabled(true);
        return;
      }

      // 기존 로직 유지
      if (selectedDateObj > today) {
        setAttendanceMessage('출석하기');
        setIsButtonDisabled(true);
      } else if (selectedDateObj < today) {
        setAttendanceMessage('지난 날짜예요.');
        setIsButtonDisabled(true);
      } else {
        const dayMapping = {
          '월': 'mon_operation_office',
          '화': 'tue_operation_office',
          '수': 'wed_operation_office',
          '목': 'thu_operation_office',
          '금': 'fri_operation_office',
          '토': 'sat_operation_office',
          '일': 'sun_operation_office'
        };

        const operationHours = officeInfo[selectedSubscription.id_office]?.[dayMapping[selectedSubscription.day_coffice]];
        
        if (!operationHours) return;

        const [openHour, openMinute] = operationHours[0].split(':').map(Number);
        const openTime = new Date();
        openTime.setHours(openHour, openMinute, 0);

        if (now < openTime) {
          setAttendanceMessage('출석하기');
          setIsButtonDisabled(true);
        } else {
          setAttendanceMessage('출석하기');
          setIsButtonDisabled(false);
        }
      }
    };

    const interval = setInterval(checkAttendanceStatus, 1000);
    checkAttendanceStatus();

    return () => clearInterval(interval);
  }, [selectedSubscription, officeInfo, selectedDate, memberStatus, selectedUserData]);

  const handleSelectUser = async (user) => {
    console.log('선택된 사용자 데이터:', user);
    
    // 현재 시간으로 Date 객체 생성
    const date = new Date();
    
    // 요일을 한글로 변환
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const koreanDay = dayNames[date.getDay()];
    
    // YYMM 형식으로 날짜 변환
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yymmDate = year + month;
    
    const userData = {
      email: user.email,
      location: {
        latitude: user.lat,
        longitude: user.lon
      },
      timestamp: date.toISOString(), // 현재 시간으로 설정
      day: koreanDay,
      date: yymmDate
    }
    
    setUserData(userData)
    
    console.log('변환된 userData:', userData);
    
    const { data: userInfo, error } = await supabase
      .from('users')
      .select('id_user, name_user, email_user, contact_user, profilestyle_user')
      .eq('email_user', userData.email)
      .single();

    // 에러 처리
    if (error) {
      console.error('사용자 정보 조회 실패:', error);
      return;
    }

    // 사용자 정보 콘솔 출력
    console.log('사용자 정보:', {
      '사용자 ID': userInfo.id_user,
      '이름': userInfo.name_user,
      '이메일': userInfo.email_user,
      '연락처': userInfo.contact_user,
      '프로필 스타일': userInfo.profilestyle_user
    });

    // 변수명 변경: preSubscriptionInfo -> loadedSubscriptionInfo
    const { data: loadedSubscriptionInfo, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        id_subscription,
        id_coffice,
        coffices (
          id_office,
          groupname_coffice,
          day_coffice,
          month_coffice,
          attendtime_coffice,
          offdate_coffice,
          offices (
            name_office
          )
        )
      `)
      .eq('activation', true)
      .eq('id_user', userInfo.id_user);

    if (subscriptionError) {
      console.error('구독 정보 조회 실패:', subscriptionError);
      return;
    }

    // 변수명 변경: formattedSubscriptions -> subscriptionInfo
    const preSubscriptionInfo = loadedSubscriptionInfo.map(subscription => ({
      id_coffice: subscription.id_coffice,
      id_office: subscription.coffices.id_office,
      groupname_coffice: subscription.coffices.groupname_coffice,
      day_coffice: subscription.coffices.day_coffice,
      attendtime_coffice: subscription.coffices.attendtime_coffice,
      month_coffice: subscription.coffices.month_coffice,
      offdate_coffice: subscription.coffices.offdate_coffice,
      name_office: subscription.coffices.offices.name_office
    }));

    // 임시 subscriptionInfo 생성 (dates 포함)
    const tempSubscriptionInfo = preSubscriptionInfo.map(sub => ({
      ...sub,
      dates: getDatesForMonth(sub.month_coffice, sub.day_coffice)
    }));

    // 각 코피스별 사용자 정보 조회
    const processedSubscriptionInfo = await Promise.all(tempSubscriptionInfo.map(async (sub) => {
      const { data: membersList, error: membersError } = await supabase
        .from('subscriptions')
        .select('id_user')
        .eq('id_coffice', sub.id_coffice)
        .eq('activation', true);

      if (membersError) {
        console.error('멤버 목록 조회 실패:', membersError);
        return sub;
      }

      // dates 배열의 각 날짜에 멤버 목록 추가 (status와 message 포함)
      const datesWithMembers = sub.dates.map(date => ({
        date: date,
        members: membersList.map(member => ({
          id_user: member.id_user,
          status: null,
          message: null
        }))
      }));

      return {
        ...sub,
        dates: datesWithMembers
      };
    }));

    // subscriptionInfo state 설정
    setSubscriptionInfo(processedSubscriptionInfo);

    console.log('멤버 정보가 추가된 구독 정보:', processedSubscriptionInfo);

    // 활성화된 구독의 모든 사용자 정보 조회
    const { data: memberData, error: memberError } = await supabase
      .from('subscriptions')
      .select(`
        users (
          id_user,
          name_user,
          email_user,
          contact_user,
          profilestyle_user
        )
      `)
      .in('id_coffice', processedSubscriptionInfo.map(sub => sub.id_coffice))
      .eq('activation', true);

    if (memberError) {
      console.error('멤버 정보 조회 실패:', memberError);
      return;
    }

    // 멤버 정보 객체 생성
    const membersInfo = memberData.reduce((acc, item) => {
      acc[item.users.id_user] = {
        id_user: item.users.id_user,
        name_user: item.users.name_user,
        email_user: item.users.email_user,
        contact_user: item.users.contact_user,
        profilestyle_user: item.users.profilestyle_user
      };
      return acc;
    }, {});

    setMembersInfo(membersInfo);
    console.log('멤버 정보:', membersInfo);

    // subscriptionDetails를 현재 요일 기준으로 가장 가까운 미래 순서로 정렬
    const currentDay = koreanDay; // 현재 요일
    const sortedSubscriptions = [...processedSubscriptionInfo].sort((a, b) => {
      const diffA = getDayDifference(currentDay, a.day_coffice);
      const diffB = getDayDifference(currentDay, b.day_coffice);
      
      // 현재 요일과 같은 경우 우선 순위를 가장 높게
      if (a.day_coffice === currentDay) return -1;
      if (b.day_coffice === currentDay) return 1;
      
      return diffA - diffB;
    });

    setSubscriptionDetails(sortedSubscriptions);

    // 정렬된 첫 번째 구독을 선택
    setSelectedSubscription(sortedSubscriptions[0]);
    
    setSelectedUserData(userInfo);
    setShowPopup(false);

    // 오피스 정보 조회
    const { data: officeData, error: officeError } = await supabase
      .from('coffices')
      .select(`
        id_coffice,
        id_office,
        offices (
          id_office,
          name_office,
          tel_office,
          address_office,
          gps_office,
          mon_operation_office,
          tue_operation_office,
          wed_operation_office,
          thu_operation_office,
          fri_operation_office,
          sat_operation_office,
          sun_operation_office
        )
      `)
      .in('id_coffice', processedSubscriptionInfo.map(sub => sub.id_coffice));

    if (officeError) {
      console.error('오피스 정보 조회 실패:', officeError);
      return;
    }

    // 오피스 정보를 id_office를 키로 하는 객체로 가공하여 중복 제거
    const processedOfficeInfo = officeData.reduce((acc, coffice) => {
      const officeDetails = coffice.offices;
      // 이미 해당 id_office의 정보가 있다면 건너뛰기
      if (!acc[coffice.id_office]) {
        acc[coffice.id_office] = {
          id_office: officeDetails.id_office,
          name_office: officeDetails.name_office,
          tel_office: officeDetails.tel_office,
          address_office: officeDetails.address_office,
          gps_office: officeDetails.gps_office,
          mon_operation_office: officeDetails.mon_operation_office,
          tue_operation_office: officeDetails.tue_operation_office,
          wed_operation_office: officeDetails.wed_operation_office,
          thu_operation_office: officeDetails.thu_operation_office,
          fri_operation_office: officeDetails.fri_operation_office,
          sat_operation_office: officeDetails.sat_operation_office,
          sun_operation_office: officeDetails.sun_operation_office
        };
      }
      return acc;
    }, {});

    setOfficeInfo(processedOfficeInfo);
    console.log('오피스 정보:', processedOfficeInfo);

    // 모든 id_coffice 추출
    const cofficeIds = processedSubscriptionInfo.map(sub => sub.id_coffice);

    // event_log 데이터 조회
    const { data: eventLogData, error: eventLogError } = await supabase
      .from('event_log')
      .select('*')
      .in('id_coffice', cofficeIds);

    if (eventLogError) {
      console.error('이벤트 로그 조회 실패:', eventLogError);
      return;
    }

    setEventLog(eventLogData);
    console.log('이벤트 로그:', eventLogData);
  }

  // createAttendanceEvent 함수 수정
  const createAttendanceEvent = async () => {
    if (!selectedSubscription || !selectedDate) return;

    setIsLoading(true); // 로딩 시작

    try {
      // 현재 GPS 위치 가져오기
      const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      };

      // 3초 대기를 위한 Promise
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // GPS 위치 가져오기와 3초 대기를 동시에 실행
      const [position] = await Promise.all([
        getCurrentPosition(),
        wait(3000)
      ]);

      const currentLat = position.coords.latitude;
      const currentLon = position.coords.longitude;

      // 오피스 GPS 정보 (이미 배열 형태)
      const [officeLat, officeLon] = officeInfo[selectedSubscription.id_office].gps_office;

      // 거리 계산
      const distance = calculateDistance(currentLat, currentLon, officeLat, officeLon);

      if (distance > 50) {
        setIsLoading(false);
        const warningMessage = document.createElement('div');
        warningMessage.className = 'alert alert-warning w-[288px] fixed top-[calc(70vh+50px)] left-1/2 -translate-x-1/2 z-50';
        warningMessage.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>코피스 근처로 이동해 주세요.</span>
        `;
        
        document.body.appendChild(warningMessage);

        setTimeout(() => {
          warningMessage.remove();
        }, 3000);

        return;
      }

      // 기존 출석 로직
      const { data: existingEvents, error: fetchError } = await supabase
        .from('event_log')
        .select('*')
        .eq('id_coffice', selectedSubscription.id_coffice)
        .eq('date_event', selectedDate)
        .in('type_event', ['출석', '일등']);

      if (fetchError) throw fetchError;

      const attendanceType = existingEvents?.length === 0 ? '일등' : '출석';

      const { data, error } = await supabase
        .from('event_log')
        .insert([
          {
            id_coffice: selectedSubscription.id_coffice,
            id_user: selectedUserData.id_user,
            type_event: attendanceType,
            message_event: null,
            date_event: selectedDate,
            timestamp_event: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      console.log('출석 이벤트 생성 성공:', data);

    } catch (error) {
      console.error('출석 이벤트 생성 실패:', error);
      const warningMessage = document.createElement('div');
      warningMessage.className = 'alert alert-warning w-[288px] fixed top-[calc(70vh+100px)] left-1/2 -translate-x-1/2 z-50';
      warningMessage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>위치 정보를 확인할 수 없습니다.</span>
      `;
      
      document.body.appendChild(warningMessage);

      setTimeout(() => {
        warningMessage.remove();
      }, 3000);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  // 메시지 업데이트 함수 수정
  const updateCofficeMessage = async () => {
    if (!selectedSubscription) return;

    try {
      // 로딩 상태 추가 (필요한 경우)
      setIsLoading(true);

      const { data, error } = await supabase
        .from('coffices')
        .update({ message_coffice: newMessage })
        .eq('id_coffice', selectedSubscription.id_coffice)
        .select();

      if (error) throw error;

      // 성공적으로 업데이트된 경우
      setCofficeMessage(newMessage);
      setShowMessageModal(false);
      setNewMessage('');
      
      // 성공 메시지 표시 (선택사항)
      const successMessage = document.createElement('div');
      successMessage.className = 'alert alert-success w-[288px] fixed top-[calc(70vh+50px)] left-1/2 -translate-x-1/2 z-50';
      successMessage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>메시지가 업데이트되었습니다.</span>
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);

    } catch (error) {
      console.error('메시지 업데이트 실패:', error);
      
      // 에러 메시지 표시
      const errorMessage = document.createElement('div');
      errorMessage.className = 'alert alert-error w-[288px] fixed top-[calc(70vh+50px)] left-1/2 -translate-x-1/2 z-50';
      errorMessage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>메시지 업데이트에 실패했습니다.</span>
      `;
      document.body.appendChild(errorMessage);
      setTimeout(() => errorMessage.remove(), 3000);

    } finally {
      setIsLoading(false);
    }
  };

  // useEffect 수정
  useEffect(() => {
    if (!selectedSubscription) return;

    // 초기 메시지 로드
    const loadCofficeMessage = async () => {
      const { data, error } = await supabase
        .from('coffices')
        .select('message_coffice')
        .eq('id_coffice', selectedSubscription.id_coffice)
        .single();

      if (error) {
        console.error('메시지 로드 실패:', error);
        return;
      }

      setCofficeMessage(data.message_coffice || '오늘도 함께 코피스~');
    };

    loadCofficeMessage();

    // 실시간 구독 설정
    const channel = supabase
      .channel('coffice_message_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'coffices',
          filter: `id_coffice=eq.${selectedSubscription.id_coffice}`
        },
        (payload) => {
          console.log('실시간 업데이트 수신:', payload);
          setCofficeMessage(payload.new.message_coffice || '오늘도 함께 코피스~');
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedSubscription]);

  // useEffect 추가 - 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.message-container')) {
        setIsMessageSelected(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 프로필 업데이트 핸들러 추가
  const handleProfileUpdate = (updatedUser) => {
    setSelectedUserData(updatedUser)
  }

  // ProfileEditModal 관련 코드 수정
  const handleCloseProfileModal = () => {
    console.log('프로필 모달 닫기');
    setShowProfileModal(false);
  };

  // users 테이블 변경 감지 및 memberInfo 업데이트를 위한 useEffect 추가
  useEffect(() => {
    if (!selectedSubscription) return;

    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모든 이벤트 감지
          schema: 'public',
          table: 'users'
        },
        async (payload) => {
          console.group('👤 Users 테이블 변경 감지');
          console.log('이벤트 타입:', payload.eventType);
          console.log('변경된 데이터:', payload.new || payload.old);

          try {
            // 현재 선택된 코피스의 모든 멤버 정보 재조회
            const { data: memberData, error: memberError } = await supabase
              .from('subscriptions')
              .select(`
                users (
                  id_user,
                  name_user,
                  email_user,
                  contact_user,
                  profilestyle_user
                )
              `)
              .eq('id_coffice', selectedSubscription.id_coffice)
              .eq('activation', true);

            if (memberError) throw memberError;

            // 멤버 정보 객체 업데이트
            const updatedMembersInfo = memberData.reduce((acc, item) => {
              acc[item.users.id_user] = {
                id_user: item.users.id_user,
                name_user: item.users.name_user,
                email_user: item.users.email_user,
                contact_user: item.users.contact_user,
                profilestyle_user: item.users.profilestyle_user
              };
              return acc;
            }, {});

            setMembersInfo(updatedMembersInfo);
            console.log('업데이트된 멤버 정보:', updatedMembersInfo);

          } catch (error) {
            console.error('멤버 정보 업데이트 실패:', error);
          }

          console.groupEnd();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedSubscription]);

  return (
    <div className="flex justify-center min-h-screen bg-gray-50">
      <main className="w-full max-w-[430px] min-h-screen bg-white p-4 mx-auto font-pretendard">
        {showPopup && (
          <UserSelectionPopup 
            userInfoList={userInfoList} 
            onSelectUser={handleSelectUser} 
          />
        )}

        {!showPopup && subscriptionDetails.length > 0 && userData && (
          <div className="flex justify-between items-start w-full max-w-[1200px] mx-auto px-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center min-w-[250px] w-auto h-[50px] px-5 py-3 border-1 border-gray-400 rounded-lg ${isDropdownOpen ? 'bg-gray-100' : 'bg-gray-100'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-black whitespace-nowrap">
                    <span className="text-[17px] font-bold leading-none flex items-center">
                      {selectedSubscription?.name_office || subscriptionDetails[0].name_office}
                    </span>
                    <span className="text-gray-500 leading-none flex items-center">
                      {parseInt((selectedSubscription?.month_coffice || subscriptionDetails[0].month_coffice).substring(2, 4))}월
                    </span>
                    <span className="text-gray-500 leading-none flex items-center">
                      {selectedSubscription?.groupname_coffice || subscriptionDetails[0].groupname_coffice}
                    </span>
                  </div>
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border">
                  {subscriptionDetails
                    .filter(subscription => 
                      selectedSubscription ? 
                        subscription.id_coffice !== selectedSubscription.id_coffice : 
                        subscription.id_coffice !== subscriptionDetails[0].id_coffice
                    )
                    .map((subscription) => (
                      <button
                        key={subscription.id_coffice}
                        onClick={() => {
                          setSelectedSubscription(subscription)
                          setIsDropdownOpen(false)
                        }}
                        className="flex items-center min-w-[260px] w-auto h-[50px] px-5 py-3 hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-black whitespace-nowrap">
                            <span className="text-[17px] font-bold leading-none">
                              {subscription.name_office}
                            </span>
                            <span className="text-gray-500 leading-none">
                              {parseInt(subscription.month_coffice.substring(2, 4))}월
                            </span>
                            <span className="text-gray-500 leading-none">
                              {subscription.groupname_coffice}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => setShowProfileModal(true)}
            >
              <div className="rounded-lg overflow-hidden border-1 border-gray-400 w-[50px] aspect-square">
                <ProfileCharacter
                  profileStyle={selectedUserData?.profilestyle_user}
                  size={48}
                  className="profile-main"
                />
              </div>
            </div>
          </div>
        )}

        {showProfileModal && (
          <ProfileEditModal
            user={selectedUserData}
            onClose={handleCloseProfileModal}
            onUpdate={(updatedUser) => {
              setSelectedUserData(updatedUser);
              setMemberInfo(prevInfo => 
                prevInfo.map(member => 
                  member.id_user === updatedUser.id_user 
                    ? { ...member, profilestyle_user: updatedUser.profilestyle_user }
                    : member
                )
              );
            }}
            className="text-black"
          />
        )}

        {!showPopup && selectedSubscription && (
          <>
            <div className="mt-2 mb-2">
      
       <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-4 justify-center">
                {selectedSubscription.dates.map((dateInfo) => {
                  const isPast = compareDates(dateInfo.date, userData.timestamp) < 0;
                  const isSelected = dateInfo.date === selectedDate;
                  const date = new Date(dateInfo.date);
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  
                  let offDates = [];
                  if (selectedSubscription.offdate_coffice) {
                    if (Array.isArray(selectedSubscription.offdate_coffice)) {
                      offDates = selectedSubscription.offdate_coffice;
                    } else if (typeof selectedSubscription.offdate_coffice === 'string') {
                      offDates = selectedSubscription.offdate_coffice.split(',').map(d => d.trim());
                    }
                  }
                  
                  const isOffDay = offDates.includes(dateInfo.date);

                  return (
                    <button
                      key={dateInfo.date}
                      onClick={() => !isOffDay && setSelectedDate(dateInfo.date)}
                      disabled={isOffDay}
                      className={`
                        shrink grow min-w-[45px] max-w-[60px] h-[32px] 
                        flex items-center justify-center 
                        rounded-full text-[13px] border-1 border-gray-350
                        ${isOffDay
                          ? 'bg-red-100 text-red-500 cursor-not-allowed'
                          : isSelected
                            ? 'bg-[#FFFF00] text-black border-black'
                            : isPast
                              ? 'bg-gray-100 text-gray-500 border-gray-200'
                              : 'bg-white text-black hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="font-medium text-[13px] whitespace-nowrap">
                        {`${month}/${day}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Timer 
              selectedSubscription={selectedSubscription} 
              officeInfo={officeInfo}
              selectedDate={selectedDate}
            />

            <div className="flex flex-col items-start mt-8 mb-4 px-4">
              <div className="flex items-center gap-0 mb-1">
                <div className="text-[19px] font-semibold text-gray-800">1등의 메시지</div>
                <div className="relative">
                  <div 
                    className="w- h-5 flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const tooltip = e.currentTarget.nextElementSibling;
                      const allTooltips = document.querySelectorAll('.message-tooltip');
                      
                      allTooltips.forEach(t => {
                        if (t !== tooltip) t.classList.add('hidden');
                      });
                      
                      tooltip.classList.toggle('hidden');
                      
                      setTimeout(() => {
                        tooltip.classList.add('hidden');
                      }, 5000);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="message-tooltip hidden absolute left-[-12px] bottom-full mb-2 w-[180px] bg-gray-800/80 text-white text-sm rounded-lg p-3 z-50">
                    <div className="text-gray-200">일등으로 출석한 사람이</div>
                    <div className="text-gray-200">메시지를 수정할 수 있어요.</div>
                    <div className="absolute left-4 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800/80"></div>
                  </div>
                </div>
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const currentUserStatus = memberStatus[selectedSubscription?.id_coffice]
                    ?.dates[today]
                    ?.members[selectedUserData?.id_user]
                    ?.status_user;
                  
                  return selectedDate === today && currentUserStatus === '일등' && (
                    <button 
                      onClick={() => setShowMessageModal(true)}
                      className="ml-2 px-2 py-0.5 text-black text-xs rounded-lg bg-[#FFFF00] border-1 border-black"
                    >
                      작성
                    </button>
                  );
                })()}
              </div>
              <div className="w-full">
                <div className="text-gray-600 text-lg font-medium break-words whitespace-pre-line" style={{ maxHeight: '2.5em', lineHeight: '1.25em', overflow: 'hidden' }}>
                  {cofficeMessage}
                </div>
              </div>
            </div>

            {showMessageModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
                <div className="bg-white rounded-2xl p-6 w-[300px]">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">메시지 작성</h3>
                  <div className="space-y-2">
                    <textarea
                      maxLength={40}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="메시지를 입력하세요"
                      className="w-full border rounded-xl px-4 py-3 text-base text-gray-800"
                      rows={2}
                      required
                    />
                    <p className="text-sm text-gray-500">
                      최대 40자까지 입력 가능합니다. ({newMessage.length}/40)
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowMessageModal(false)}
                      className="flex-1 btn btn-outline text-gray-800"
                    >
                      취소
                    </button>
                    <button
                      onClick={updateCofficeMessage}
                      className="flex-1 btn bg-[#FFFF00] hover:bg-[#FFFF00] text-black border-1 border-black shadow-none"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="text-[20px] font-semibold text-gray-800 ml-4">
              
                출석 현황
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pt-3 pb-4">
                {selectedSubscription.dates
                  .find(date => date.date === selectedDate)
                  ?.members
                  .sort((a, b) => {
                    const statusOrder = {
                      '일등': 0,
                      '출석': 1,
                      '지각': 2,
                      '결석': 3,
                      null: 4 // 대기 상태
                    };
                    
                    const statusA = memberStatus[selectedSubscription.id_coffice]
                      ?.dates[selectedDate]
                      ?.members[a.id_user]
                      ?.status_user;
                    
                    const statusB = memberStatus[selectedSubscription.id_coffice]
                      ?.dates[selectedDate]
                      ?.members[b.id_user]
                      ?.status_user;
                    
                    return statusOrder[statusA] - statusOrder[statusB];
                  })
                  .map(member => {
                    const status = memberStatus[selectedSubscription.id_coffice]
                      ?.dates[selectedDate]
                      ?.members[member.id_user];
                    const memberInfo = membersInfo[member.id_user];
                    const isCurrentUser = member.id_user === selectedUserData?.id_user;

                    return (
                      <MemberCard 
                        key={`${member.id_user}-${selectedDate}`}
                        member={member}
                        date={selectedDate}
                        officeId={selectedSubscription.id_coffice}
                        memberInfo={memberInfo}
                        status={status}
                        selectedUserData={selectedUserData}
                        memberStatus={memberStatus}
                      />
                    );
                  })}
              </div>

              <button
                onClick={createAttendanceEvent}
                disabled={isButtonDisabled || isLoading}
                className={`
                  btn w-[288px] h-[48px] mx-auto mt-4 block
                  border border-[#c8c8c8] normal-case rounded-lg
                  relative
                  ${isButtonDisabled || isLoading
                    ? 'bg-[#DEDEDE] text-black hover:bg-[#DEDEDE]' 
                    : 'bg-[#FFFF00] text-black hover:bg-[#FFFF00]'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <span className="text-[16px] font-semibold">{attendanceMessage}</span>
                  )}
                </div>
              </button>
            </div>
          </>
        )}

        <style jsx global>{`
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;     /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;  /* Chrome, Safari, Opera */
          }
          * {
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
          }
        `}</style>
      </main>
    </div>
  )
}
