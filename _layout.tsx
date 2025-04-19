import React, { useState, useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import { usePathname } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import Navbar from "./navbar";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChevronDown,
  ChevronUp,
  Home,
  Calendar,
  FileText,
  DollarSign,
  ShoppingCart,
} from "lucide-react-native";

type RootStackParamList = {
  "(tabs)": undefined;
  attendance: undefined;
  "apply-leave": undefined;
  "my-leaves": undefined;
  "all-leaves": undefined;
  expenseform: undefined;
  userattendance: undefined;
  expensedetails: undefined;
  addrequisition: undefined;
  requisitions: undefined;
  allrequisitions: undefined;
  "manage-leaves": undefined;
  "my-requisitions": undefined;
  allexpense: undefined;
  "manage-expense": undefined;
  "expense-report": undefined;
  "requisition-report": undefined;
};

interface MenuSection {
  key: string;
  title: string;
  icon: React.ReactNode;
  items: {
    label: string;
    route: keyof RootStackParamList;
    requiresManager?: boolean;
  }[];
}

const CustomDrawerContent = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const pathname = usePathname();
  const [roleId, setRoleId] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const animations = React.useRef<Record<string, Animated.Value>>({}).current;

  const menuSections: MenuSection[] = [
    {
      key: "attendance",
      title: "Attendance",
      icon: <Calendar size={25} color="#1f2937" style={styles.icon} />,
      items: [
        { label: "My Attendance", route: "attendance" as keyof RootStackParamList },
        { label: "User Attendance", route: "userattendance" as keyof RootStackParamList },
      ],
    },
    {
      key: "leave",
      title: "Leaves",
      icon: <FileText size={25} color="#1f2937" style={styles.icon} />,
      items: [
        { label: "Add Leave", route: "apply-leave" as keyof RootStackParamList },
        { label: "My Leaves", route: "my-leaves" as keyof RootStackParamList },
        { label: "All Leaves", route: "all-leaves" as keyof RootStackParamList, requiresManager: true },
        {
          label: "Manage Leaves",
          route: "manage-leaves" as keyof RootStackParamList,
          requiresManager: true,
        },
      ],
    },
    {
      key: "expenses",
      title: "Expenses",
      icon: <DollarSign size={25} color="#1f2937" style={styles.icon} />,
      items: [
        { label: "Add Expenses", route: "expenseform" as keyof RootStackParamList },
        { label: "My Expenses", route: "expensedetails" as keyof RootStackParamList },
        { label: "All Expenses", route: "allexpense" as keyof RootStackParamList, requiresManager: true },
        {
          label: "Manage Expenses",
          route: "manage-expense" as keyof RootStackParamList,
          requiresManager: true,
        },
      ],
    },
    {
      key: "requisition",
      title: "Requisition",
      icon: <ShoppingCart size={25} color="#1f2937" style={styles.icon} />,
      items: [
        { label: "Add Requisition", route: "addrequisition" as keyof RootStackParamList },
        { label: "My Requisitions", route: "my-requisitions" as keyof RootStackParamList },
        {
          label: "All Requisitions",
          route: "allrequisitions" as keyof RootStackParamList,
          requiresManager: true,
        },
        {
          label: "Manage Requisitions",
          route: "requisitions" as keyof RootStackParamList,
          requiresManager: true,
        },
      ],
    },
  ].concat(
    roleId === 1 || roleId === 8
      ? [
          {
            key: "accounts",
            title: "Accounts",
            icon: (
              <ShoppingCart size={25} color="#1f2937" style={styles.icon} />
            ),
            items: [
              {
                label: "Expense Report",
                route: "expense-report" as keyof RootStackParamList,
                requiresManager: true,
              },
              {
                label: "Requisition Report",
                route: "requisition-report" as keyof RootStackParamList,
                requiresManager: true,
              },
            ],
          },
        ]
      : []
  );

  menuSections.forEach((section) => {
    if (!animations[section.key]) {
      animations[section.key] = new Animated.Value(0);
    }
  });

  useEffect(() => {
    const fetchRoleId = async () => {
      try {
        const storedRoleId = await AsyncStorage.getItem("roleId");
        setRoleId(storedRoleId ? parseInt(storedRoleId, 10) : null);
      } catch (error) {
        console.error("Error fetching roleId:", error);
      }
    };
    fetchRoleId();
  }, []);

  const hasManagerPermissions = roleId !== null && (roleId < 5 || roleId === 8);

  useEffect(() => {
    menuSections.forEach((section) => {
      const containsCurrentRoute = section.items.some(
        (item) =>
          pathname === `/${item.route}` ||
          pathname.startsWith(`/${item.route}/`)
      );
      if (containsCurrentRoute && !expandedSections[section.key]) {
        toggleSection(section.key, false);
      }
    });
  }, [pathname]);

  const toggleSection = (sectionKey: string, shouldAnimate = true) => {
    const isExpanded = !expandedSections[sectionKey];
    setExpandedSections((prev) => ({ ...prev, [sectionKey]: isExpanded }));

    const section = menuSections.find((s) => s.key === sectionKey);
    if (!section) return;

    const visibleItems = section.items.filter(
      (item) =>
        !item.requiresManager || (item.requiresManager && hasManagerPermissions)
    ).length;

    const heightValue = isExpanded ? visibleItems * 48 : 0;

    if (shouldAnimate) {
      Animated.spring(animations[sectionKey], {
        toValue: heightValue,
        speed: 12,
        bounciness: 0,
        useNativeDriver: false,
      }).start();
    } else {
      animations[sectionKey].setValue(heightValue);
    }
  };

  const isRouteActive = (route: string) => {
    return pathname === `/${route}` || pathname.startsWith(`/${route}/`);
  };

  const renderSection = (section: MenuSection) => {
    const visibleItems = section.items.filter(
      (item) =>
        !item.requiresManager || (item.requiresManager && hasManagerPermissions)
    );

    return (
      <View key={section.key} style={styles.group}>
        <TouchableOpacity
          style={[
            styles.groupHeader,
            visibleItems.some((item) => isRouteActive(item.route)) &&
              styles.activeGroupHeader,
          ]}
          onPress={() => toggleSection(section.key)}
          activeOpacity={0.7}
        >
          {section.icon}
          <Text
            style={[
              styles.groupHeaderText,
              visibleItems.some((item) => isRouteActive(item.route)) &&
                styles.activeGroupHeaderText,
            ]}
          >
            {section.title}
          </Text>
          {expandedSections[section.key] ? (
            <ChevronUp size={25} color="#1f2937" style={styles.arrowIcon} />
          ) : (
            <ChevronDown size={25} color="#1f2937" style={styles.arrowIcon} />
          )}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.subItemsContainer,
            {
              height: animations[section.key],
              opacity: animations[section.key].interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          {visibleItems.map((item, index) => (
            <TouchableOpacity
              key={`${section.key}-${index}`}
              style={[
                styles.drawerItem,
                isRouteActive(item.route) && styles.activeDrawerItem,
              ]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.sub,
                  isRouteActive(item.route) && styles.activeSubText,
                ]}
              >
                {item.label}
              </Text>
              {isRouteActive(item.route) && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.drawerContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={require("../assets/images/geomaticx_logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <TouchableOpacity
        style={[
          styles.groupHeader,
          (pathname === "/" || pathname.startsWith("/(tabs)")) &&
            styles.activeGroupHeader,
        ]}
        onPress={() => navigation.navigate("(tabs)")}
        activeOpacity={0.7}
      >
        <Home size={25} color="#1f2937" style={styles.icon} />
        <Text
          style={[
            styles.groupHeaderText,
            (pathname === "/" || pathname.startsWith("/(tabs)")) &&
              styles.activeGroupHeaderText,
          ]}
        >
          Dashboard
        </Text>
      </TouchableOpacity>

      {menuSections.map((section) => renderSection(section))}
    </ScrollView>
  );
};

export default function RootLayout() {
  useFrameworkReady();
  const pathname = usePathname();
  const isLoginScreen = pathname === "/";
  const [key, setKey] = useState(0);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const lastLoginTime = await AsyncStorage.getItem("lastLoginTime");
        const currentLoginTime = await AsyncStorage.getItem("currentLoginTime");

        if (lastLoginTime !== currentLoginTime && currentLoginTime) {
          await AsyncStorage.setItem("lastLoginTime", currentLoginTime);
          setKey((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    if (!isLoginScreen) {
      checkLoginStatus();
    }
  }, [isLoginScreen]);

  return (
    <Drawer
      key={key}
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        header: () => !isLoginScreen && <Navbar />,
        drawerStyle: {
          width: 280,
        },
        swipeEnabled: !isLoginScreen,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: "none" },
          swipeEnabled: false,
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="attendance"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="apply-leave"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="my-leaves"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="all-leaves"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="expenseform"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="userattendance"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="expensedetails"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="addrequisition"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="requisitions"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="allrequisitions"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="manage-leaves"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="my-requisitions"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="allexpense"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="expense-report"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="requisition-report"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  logo: {
    width: 150,
    height: 50,
    alignSelf: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: "#ffffff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeGroupHeader: {
    backgroundColor: "#e5e7eb",
  },
  groupHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 12,
  },
  activeGroupHeaderText: {
    color: "#1e40af",
    fontWeight: "700",
  },
  group: {
    marginBottom: 8,
    overflow: "hidden",
  },
  subItemsContainer: {
    overflow: "hidden",
    paddingLeft: 12,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -4,
  },
  drawerItem: {
    paddingVertical: 12,
    paddingLeft: 48,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeDrawerItem: {
    backgroundColor: "#e5e7eb",
    borderLeftWidth: 4,
    borderLeftColor: "#1e40af",
    paddingLeft: 44,
  },
  sub: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  activeSubText: {
    color: "#1e40af",
    fontWeight: "600",
  },
  icon: {
    marginRight: 0,
  },
  arrowIcon: {
    marginLeft: "auto",
    marginRight: 4,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1e40af",
    marginRight: 8,
  },
});
