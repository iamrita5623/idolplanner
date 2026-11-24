/* IDOL PLANNER v1.1 — shared map/distance utility. No data or login state. */
(function () {
    "use strict";
    const calculateKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // 地球半徑 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };
    window.IdolPlannerMap = Object.freeze({ calculateKm });
})();
