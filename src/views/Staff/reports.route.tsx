import StaffTools from "./StaffTools";

export default {
    path: "/staff/reports",
    component: <StaffTools title="Reports" endpoint="/api/staff/reports" message="Reports submitted by players appear here." />,
    title: `Staff Reports | ${import.meta.env.VITE_INFORMATION_NAME}`,
    pageHeader: "Staff Reports"
} satisfies BlacketRoute;
