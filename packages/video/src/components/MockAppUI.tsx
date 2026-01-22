import { AbsoluteFill } from 'remotion'
import { card, colors } from '../styles/styles'

interface MockAppUIProps {
  highlightTarget?:
    | 'sidebar-nav'
    | 'header-avatar'
    | 'main-card'
    | 'settings-btn'
    | null
}

export const MockAppUI = ({ highlightTarget }: MockAppUIProps) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 260,
          backgroundColor: card.background,
          borderRight: `1px solid ${colors.border}`,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: colors.foreground,
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.foreground,
            }}
          />
          Flowsterix
        </div>

        {/* Nav Items */}
        {['Dashboard', 'Analytics', 'Projects', 'Settings'].map((item, i) => (
          <div
            key={item}
            id={i === 0 ? 'sidebar-nav' : undefined}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              color: i === 0 ? colors.foreground : colors.muted,
              backgroundColor:
                i === 0 ? 'rgba(250, 250, 250, 0.1)' : 'transparent',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                backgroundColor: i === 0 ? colors.foreground : colors.muted,
                opacity: i === 0 ? 1 : 0.4,
              }}
            />
            {item}
          </div>
        ))}
      </div>

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          left: 260,
          top: 0,
          right: 0,
          height: 64,
          backgroundColor: card.background,
          borderBottom: `1px solid ${colors.border}`,
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{ fontSize: 18, fontWeight: 600, color: colors.foreground }}
        >
          Dashboard
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            id="settings-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'rgba(250, 250, 250, 0.05)',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `2px solid ${colors.muted}`,
              }}
            />
          </div>
          <div
            id="header-avatar"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: colors.foreground,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.background,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            JD
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          position: 'absolute',
          left: 260,
          top: 64,
          right: 0,
          bottom: 0,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Total Users', value: '12,543', change: '+12%' },
            { label: 'Active Tours', value: '847', change: '+5%' },
            { label: 'Completion Rate', value: '94.2%', change: 'Above avg' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              id={i === 0 ? 'main-card' : undefined}
              style={{
                flex: 1,
                backgroundColor: card.background,
                borderRadius: 12,
                padding: 20,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    color: colors.foreground,
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    color: colors.success,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            backgroundColor: card.background,
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              color: colors.foreground,
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            Analytics Overview
          </div>
          <div
            style={{
              height: 280,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              paddingTop: 16,
            }}
          >
            {[65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 72].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  backgroundColor: 'rgba(250, 250, 250, 0.15)',
                  borderRadius: '6px 6px 0 0',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const TARGET_RECTS = {
  'sidebar-nav': { x: 20, y: 100, width: 220, height: 44 },
  'header-avatar': { x: 1836, y: 12, width: 40, height: 40 },
  'main-card': { x: 288, y: 92, width: 480, height: 100 },
  'settings-btn': { x: 1780, y: 14, width: 36, height: 36 },
}
