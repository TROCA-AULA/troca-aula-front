'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { useNotifications } from '@/hooks/useNotifications';

const Wrapper = styled.div`
  position: relative;
`;

const BellButton = styled.button`
  position: relative;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 6px;
  border-radius: 8px;

  &:hover {
    background: #f0f4f8;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #d32f2f;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Dropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 320px;
  max-height: 380px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 50;
`;

const DropdownHeader = styled.div`
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const ItemLink = styled(Link)`
  display: block;
  padding: 10px 14px;
  text-decoration: none;
  border-bottom: 1px solid #f5f5f5;

  &:hover {
    background: #f7fafc;
  }
`;

const ItemTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
`;

const ItemDescription = styled.div`
  font-size: 12px;
  color: #555;
  margin-top: 2px;
`;

const ItemTime = styled.div`
  font-size: 11px;
  color: #999;
  margin-top: 4px;
`;

const EmptyState = styled.div`
  padding: 24px 14px;
  text-align: center;
  font-size: 13px;
  color: #666;
`;

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h atrás`;
  const days = Math.floor(hours / 24);
  return `${days} d atrás`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora (mesmo padrão simples de dropdown do projeto).
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggleOpen = () => {
    setOpen((previous) => {
      // Abrir o sino marca tudo como lido — o badge só conta o que chegou
      // desde a última vez que o usuário olhou.
      if (!previous) markAllAsRead();
      return !previous;
    });
  };

  return (
    <Wrapper ref={wrapperRef}>
      <BellButton
        type="button"
        aria-label="Notificações"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        🔔
        {unreadCount > 0 && <Badge data-testid="notification-badge">{unreadCount}</Badge>}
      </BellButton>

      {open && (
        <Dropdown role="menu">
          <DropdownHeader>Notificações</DropdownHeader>
          {notifications.length === 0 ? (
            <EmptyState>Nenhuma novidade por aqui.</EmptyState>
          ) : (
            notifications.map((notification) => (
              <ItemLink
                key={notification.id}
                href={notification.href}
                onClick={() => setOpen(false)}
              >
                <ItemTitle>{notification.title}</ItemTitle>
                <ItemDescription>{notification.description}</ItemDescription>
                <ItemTime>{relativeTime(notification.createdAt)}</ItemTime>
              </ItemLink>
            ))
          )}
        </Dropdown>
      )}
    </Wrapper>
  );
}
