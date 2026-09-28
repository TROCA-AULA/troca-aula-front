'use client';

import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserName = styled.span`
  font-size: 14px;
  color: #666;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #1e3a5f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
`;

interface MasterHeaderProps {
  title?: string;
  userName: string;
}

export function MasterHeader({ title = 'Área Administrativa', userName }: MasterHeaderProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || '?';
  return (
    <HeaderContainer role="banner">
      <Title>{title}</Title>
      <UserInfo>
        <UserName>{userName}</UserName>
        <Avatar aria-label="Avatar do usuário">{initial}</Avatar>
      </UserInfo>
    </HeaderContainer>
  );
}