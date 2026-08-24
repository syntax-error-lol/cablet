import StaffTools from "./StaffTools";

export default {
    path: "/staff/reports",
    component: <StaffTools title="Reports" message="There are no reports in the local data store." />,
    title: `Staff Reports | ${import.meta.env.VITE_INFORMATION_NAME}`,
    pageHeader: "Staff Reports"
} satisfies BlacketRoute;
