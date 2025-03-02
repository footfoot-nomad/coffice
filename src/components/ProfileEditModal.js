'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { defaultCharacterDrawing } from './character'
import ProfileCharacter from './ProfileCharacter'

export default function ProfileEditModal({ user, onClose, onUpdate }) {
  const [profileStyle, setProfileStyle] = useState(user?.profilestyle_user || '#f3f4f6')
  const [name, setName] = useState(user?.name_user || '')
  const [contact, setContact] = useState(user?.contact_user || '')
  
  // 캐릭터 정보를 저장하는 객체 상태 수정
  const [characterInfo, setCharacterInfo] = useState(() => {
    try {
      // profilestyle_user가 배열인지 확인
      const profileStyle = Array.isArray(user?.profilestyle_user) 
        ? user.profilestyle_user 
        : [0, 0, 0, 0, 0];
      
      return {
        hairNo: profileStyle[0] ?? 0,
        faceNo: profileStyle[1] ?? 0,
        hairColor: profileStyle[2] ?? 0,
        faceColor: profileStyle[3] ?? 0,
        backgroundColor: profileStyle[4] ?? 0
      }
    } catch (error) {
      console.error('프로필 스타일 파싱 오류:', error);
      return {
        hairNo: 0,
        faceNo: 0,
        hairColor: 0,
        faceColor: 0,
        backgroundColor: 0
      }
    }
  })

  // 색상 리스트 정의
  const colorList = [
    
        "#FFFF00",
        "#B2F632",
        "#62EC68",
        "#38F3FF",
        "#64C1FF",
        "#569AFF",
        "#5F6BFF",
        "#B68FFF",
        "#A126FF",
        "#F65AFF",
        "#FF8FCC",
        "#FFA51F",
        "#FF4A1F"
      
  
  ]

  const [subscriptionData, setSubscriptionData] = useState([])

  // 이름 수정 모달 상태 추가
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [newName, setNewName] = useState(name)

  // 이름 수정 확인 모달 상태 추가
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  // 오피스 정보 모달 상태 추가
  const [selectedOffice, setSelectedOffice] = useState(null)
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false)

  // 캐릭터 편집 모달 상태 추가
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false)

  // convertCharacterInfoToProfileStyle 함수도 수정
  const convertCharacterInfoToProfileStyle = () => {
    return [
      characterInfo.hairNo,
      characterInfo.faceNo,
      characterInfo.hairColor,  // hairColor가 올바르게 포함되어 있는지 확인
      0,  // faceColor를 항상 0으로 고정
      characterInfo.backgroundColor
    ];
  }

  // 색상 선택 핸들러 수정
  const updateCharacterInfo = (key, value) => {
    setCharacterInfo(prev => ({
      ...prev,
      [key]: value
      
    }))
  }

  // drawCharacter 함수 제거

  // 구독 정보 조회 함수
  const fetchSubscriptions = async () => {
    const currentDate = new Date()
    const yearMonth = `${String(currentDate.getFullYear()).slice(-2)}${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          coffices!inner (
            day_coffice,
            month_coffice,
            offices!inner (
              name_office,
              address_office,
              tel_office,
              mon_operation_office,
              tue_operation_office,
              wed_operation_office,
              thu_operation_office,
              fri_operation_office,
              sat_operation_office,
              sun_operation_office
            )
          )
        `)
        .eq('id_user', user.id_user)
        .eq('activation', true)
        .eq('coffices.month_coffice', yearMonth)

      if (error) throw error
      
      // 데이터 구조 변환
      const formattedData = data.reduce((acc, sub) => {
        const existingOffice = acc.find(item => item.name_office === sub.coffices.offices.name_office);
        
        if (existingOffice) {
          existingOffice.days.push(sub.coffices.day_coffice);
        } else {
          acc.push({
            name_office: sub.coffices.offices.name_office,
            address_office: sub.coffices.offices.address_office,
            tel_office: sub.coffices.offices.tel_office,
            days: [sub.coffices.day_coffice],
            operation_office: [
              sub.coffices.offices.mon_operation_office,
              sub.coffices.offices.tue_operation_office,
              sub.coffices.offices.wed_operation_office,
              sub.coffices.offices.thu_operation_office,
              sub.coffices.offices.fri_operation_office,
              sub.coffices.offices.sat_operation_office,
              sub.coffices.offices.sun_operation_office
            ]
          });
        }
        return acc;
      }, []);
      
      console.log('원본 데이터:', data)  // 원본 데이터 출력
      console.log('변환된 데이터:', formattedData)  // 변환된 데이터 출력
      
      setSubscriptionData(formattedData)
    } catch (error) {
      console.error('구독 정보 조회 실패:', error)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  // 프로필 업데이트 함수 수정
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name_user: name,
          contact_user: contact,
          profilestyle_user: convertCharacterInfoToProfileStyle(),
          
        })
        .eq('id_user', user.id_user)
        .select()

      if (error) throw error
      onClose()
      if (onUpdate) {
        onUpdate(data[0])
      }
    } catch (error) {
      console.error('프로필 업데이트 실패:', error)
    }
  }

  // 랜덤 생성 함수 수정
  const randomGenerator = () => {
    setCharacterInfo({
      hairNo: Math.floor(Math.random() * 12),  // 0-11
      faceNo: Math.floor(Math.random() * 3),   // 0-2
      hairColor: Math.floor(Math.random() * colorList.length),
      faceColor: 0,  // faceColor를 항상 0으로 고정
      backgroundColor: Math.floor(Math.random() * colorList.length)
    })
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // 로그아웃 후 페이지 새로고침
      window.location.reload()
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  // 이름 업데이트 함수
  const updateName = async (newName) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ name_user: newName })
        .eq('id_user', user.id_user)
        .select()

      if (error) throw error

      setName(newName)
      onUpdate({ ...user, name_user: newName })
    } catch (error) {
      console.error('이름 업데이트 실패:', error)
    }
  }

  // 이름 클릭 핸들러 수정
  const handleNameClick = () => {
    setIsConfirmModalOpen(true)
  }

  // 이름 수정 시작
  const startNameEdit = () => {
    setIsConfirmModalOpen(false)
    setIsNameModalOpen(true)
  }

  // 이름 수정 제출 핸들러 추가
  const handleNameSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateName(newName)
      setIsNameModalOpen(false)
    } catch (error) {
      console.error('이름 수정 실패:', error)
    }
  }

  // 오피스 클릭 핸들러
  const handleOfficeClick = (office) => {
    setSelectedOffice(office)
    setIsOfficeModalOpen(true)
  }

  // 캐릭터 이미지 클릭 핸들러 추가
  const handleCharacterClick = () => {
    setIsCharacterModalOpen(true)
  }

//   // characterInfo 객체에서 실제 색상 값을 사용할 때
//   const getCharacterStyle = () => {
//     return {
//       backgroundColor: colorList[characterInfo.backgroundColor],
//       // 다른 스타일 속성들...
//     }
//   }

  return (
    <div className="fixed inset-0 bg-white z-50 animate-slide-down overflow-y-auto">
      {/* 메인 닫기 버튼 */}
      <button 
        type="button"
        onClick={() => {
          console.log('닫기 버튼 클릭됨');
          if (typeof onClose === 'function') {
            onClose();
          } else {
            console.error('onClose is not a function:', onClose);
          }
        }}
        className="btn btn-circle btn-ghost absolute right-4 top-4 text-2xl z-100 text-black"
      >
        ✕
      </button>
      
      <div className="max-w-[430px] mx-auto pb-8">
        
        <div className="relative flex justify-center h-[250px]">
          {/* 목걸이 */}
          <img 
            src="/img/necklace.png" 
            alt="necklace" 
            className="absolute top-[-180px] w-32 h-64 z-10" 
          />
          {/* 명찰이미지 */}
          <div className="absolute top-[30px] w-[310px] min-h-[500px] bg-white rounded-2xl 
            border-2 border-black 
            shadow-[0_2px_8px_rgba(0,0,0,0.1)]
            z-20"
          >
            {/* 캐릭터 이미지를 ProfileCharacter 컴포넌트로 교체 */}
            <div className="flex justify-center items-center mt-12">
              <div className="rounded-xl overflow-hidden border-2 border-black w-[160px] aspect-square ">
                <ProfileCharacter
                  profileStyle={user?.profilestyle_user}
                  size={156}
                  className="profile-modal"
                  onClick={handleCharacterClick}
                />
              </div>
            </div>

            {/* 구독 정보 표시 */}
            <div className="mt-8 px-4">
              <div className="space-y-3">
                {/* 사용자 이름 표시 */}
                <div className="text-center mt-[-20px]">
                  <span 
                    className="text-3xl font-bold tracking-wide block py-4 cursor-pointer hover:text-gray-600 text-black"
                    onClick={handleNameClick}
                  >
                    {name}
                  </span>
                </div>
                {subscriptionData.map((sub, index) => (
                  <div key={index} className="text-center">
                    
                    <span 
                      className="block text-lg font-bold cursor-pointer hover:text-blue-600 text-black"
                      onClick={() => handleOfficeClick(sub)}
                    >
                      {sub.name_office}
                    </span>
                    <span className="text-sm text-black">{sub.days.join(', ')}</span>
                  </div>
                ))}
                {subscriptionData.length === 0 && (
                  <p className="text-sm text-black text-center">구독 중인 상품이 없습니다.</p>
                )}
                
              </div>
            </div>
          </div>
        </div>

        {/* 로그아웃 버튼 위치 수정 */}
        <div className="mt-[300px] px-4 pb-8">
          <button
            type="button"
            onClick={handleLogout}
            className="btn w-full rounded-lg py-3 text-white"
            style={{ backgroundColor: '#727272', borderRadius: '8px' }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 이름 수정 확인 모달 추가 */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-6 w-[300px]">
            <h3 className="text-lg font-bold mb-4">이름을 수정하시겠습니까?</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 btn btn-outline"
              >
                취소
              </button>
              <button
                type="button"
                onClick={startNameEdit}
                className="flex-1 btn btn-primary"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기존 이름 수정 모달 */}
      {isNameModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-6 w-[300px]">
            <h3 className="text-lg font-bold mb-4">이름 수정</h3>
            <form onSubmit={handleNameSubmit}>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-base"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500">
                  최대 6자까지 입력 가능합니다. ({newName.length}/6)
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsNameModalOpen(false)}
                  className="flex-1 btn btn-outline"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 오피스 정보 모달 수정 */}
      {isOfficeModalOpen && selectedOffice && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOfficeModalOpen(false);
            }
          }}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-[320px] max-w-[90%] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-black">{selectedOffice.name_office}</h3>
              <button 
                onClick={() => setIsOfficeModalOpen(false)}
                className="btn btn-ghost btn-circle text-xl text-black"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-black block mb-1 font-bold">주소</label>
                <p className="text-base text-black">{selectedOffice.address_office}</p>
              </div>
              <div>
                <label className="text-sm text-black block mb-1 font-bold">전화번호</label>
                <p className="text-base text-black">{selectedOffice.tel_office}</p>
              </div>
              <div>
                <label className="text-sm text-black block mb-1 font-bold">운영시간</label>
                <div className="space-y-1 text-sm text-black">
                  <p>월요일: {selectedOffice.operation_office[0] ? 
                    `${selectedOffice.operation_office[0][0]} ~ ${selectedOffice.operation_office[0][1]}` : 
                    '휴무'}</p>
                  <p>화요일: {selectedOffice.operation_office[1] ? 
                    `${selectedOffice.operation_office[1][0]} ~ ${selectedOffice.operation_office[1][1]}` : 
                    '휴무'}</p>
                  <p>수요일: {selectedOffice.operation_office[2] ? 
                    `${selectedOffice.operation_office[2][0]} ~ ${selectedOffice.operation_office[2][1]}` : 
                    '휴무'}</p>
                  <p>목요일: {selectedOffice.operation_office[3] ? 
                    `${selectedOffice.operation_office[3][0]} ~ ${selectedOffice.operation_office[3][1]}` : 
                    '휴무'}</p>
                  <p>금요일: {selectedOffice.operation_office[4] ? 
                    `${selectedOffice.operation_office[4][0]} ~ ${selectedOffice.operation_office[4][1]}` : 
                    '휴무'}</p>
                  <p>토요일: {selectedOffice.operation_office[5] ? 
                    `${selectedOffice.operation_office[5][0]} ~ ${selectedOffice.operation_office[5][1]}` : 
                    '휴무'}</p>
                  <p>일요일: {selectedOffice.operation_office[6] ? 
                    `${selectedOffice.operation_office[6][0]} ~ ${selectedOffice.operation_office[6][1]}` : 
                    '휴무'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 캐릭터 편집 모달 수정 */}
      {isCharacterModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-[430px] max-h-[90vh] overflow-hidden border-2 border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-black">캐릭터 편집</h3>
              <button 
                onClick={() => setIsCharacterModalOpen(false)}
                className="btn btn-ghost btn-circle text-xl text-black"
              >
                ✕
              </button>
            </div>

            {/* 캐릭터 미리보기 - 고정 */}
            <div className="flex justify-center mb-6">
              <div className="inline-block rounded-xl overflow-hidden border-2 border-black">
                <ProfileCharacter 
                  profileStyle={[
                    characterInfo.hairNo,
                    characterInfo.faceNo,
                    characterInfo.hairColor,
                    characterInfo.faceColor,
                    characterInfo.backgroundColor
                  ]}
                  size={160}
                  className="character-edit"
                />
              </div>
            </div>

            {/* 스크롤 가능한 선택 항목들 */}
            <div className="overflow-y-auto max-h-[calc(90vh-400px)] pr-2">
              <div className="space-y-6">
                {/* 헤어스타일 선택 */}
                <div>
                  <h3 className="text-sm text-black mb-4">헤어스타일</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({length: 13}, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateCharacterInfo('hairNo', i)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg text-sm text-black
                          ${characterInfo.hairNo === i ? 'border-black bg-[#63C1FF]' : 'border-black'}`}
                      >
                        {i+1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 얼굴 선택 */}
                <div>
                  <h3 className="text-sm text-black mb-4">얼굴</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({length: 4}, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateCharacterInfo('faceNo', i)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg text-sm text-black
                          ${characterInfo.faceNo === i ? 'border-black bg-[#63C1FF]' : 'border-black'}`}
                      >
                        {i+1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 색상 선택 */}
                <div>
                  <h3 className="text-sm text-black mb-4">색상 선택</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-black mb-2">헤어 색상</label>
                      <div className="grid grid-cols-7 gap-2">
                        {colorList.map((color, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => updateCharacterInfo('hairColor', index)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              characterInfo.hairColor === index ? 'border-blue-500' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: colorList[index] }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-black mb-2">배경 색상</label>
                      <div className="grid grid-cols-7 gap-2">
                        {colorList.map((color, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => updateCharacterInfo('backgroundColor', index)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              characterInfo.backgroundColor === index ? 'border-blue-500' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: colorList[index] }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={randomGenerator}
                  className="w-full rounded-xl py-3 font-medium mb-4 text-white relative overflow-hidden"
                >
                  <div className="absolute inset-0">
                    {colorList.map((color, index) => (
                      <div
                        key={index}
                        className="absolute h-full"
                        style={{
                          backgroundColor: color,
                          width: `${100 / colorList.length}%`,
                          left: `${(index * 100) / colorList.length}%`
                        }}
                      />
                    ))}
                  </div>
                  <span className="relative z-10">랜덤 생성</span>
                </button>
              </div>
            </div>

            {/* 하단 버튼 - 고정 */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsCharacterModalOpen(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    // 업데이트할 데이터 객체 생성
                    const newProfileStyle = convertCharacterInfoToProfileStyle();
                    
                    const { data, error } = await supabase
                      .from('users')
                      .update({
                        profilestyle_user: newProfileStyle
                      })
                      .eq('id_user', user.id_user)
                      .select();

                    if (error) {
                      console.error('Supabase 에러:', error);
                      throw error;
                    }

                    // 모달 닫기
                    setIsCharacterModalOpen(false);
                    
                    // 부모 컴포넌트의 memberInfo 업데이트
                    if (onUpdate) {
                      onUpdate({
                        ...user,
                        profilestyle_user: newProfileStyle
                      });
                    }
                  } catch (error) {
                    console.error('프로필 스타일 업데이트 실패:', error);
                    alert('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
                  }
                }}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 