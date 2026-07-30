import styles from "./Menu.module.css";

const MENU_CONTENT = {
  home: {
    title: "Home",
    description: "You are currently on the Home screen",
    icon: "🏠",
  },
  venues: {
    title: "Venues",
    description: "You are currently on the Venues screen",
    icon: "📍",
  },
  calendar: {
    title: "Calendar",
    description: "You are currently on the Calendar screen",
    icon: "📅",
  },
  events: {
    title: "Events",
    description: "You are currently on the Events screen",
    icon: "📋",
  },
  tasks: {
    title: "Tasks",
    description: "You are currently on the Tasks screen",
    icon: "✅",
  },
};

export default function Menu({ activePath }) {
  // Determine which menu to show based on active path
  let activeKey = "home";

  if (activePath.includes("/venues")) activeKey = "venues";
  else if (activePath.includes("/calendar")) activeKey = "calendar";
  else if (activePath.includes("/events")) activeKey = "events";
  else if (activePath.includes("/tasks")) activeKey = "tasks";
  // Home is default (covers /staff/home, /faculty/home, etc.)

  const menu = MENU_CONTENT[activeKey];

  return (
    <div className={styles.menuContainer}>
      <div className={styles.menuIcon}>{menu.icon}</div>
      <h3 className={styles.menuTitle}>{menu.title} Menu</h3>
      <p className={styles.menuDescription}>{menu.description}</p>
      <div className={styles.menuDivider} />
      <div className={styles.menuPlaceholder}>
        <p>Menu content for <strong>{menu.title}</strong> will be placed here.</p>
      </div>
    </div>
  );
}