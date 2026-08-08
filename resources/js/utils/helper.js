import secureLocalStorage from "react-secure-storage";
import dayjs from "dayjs";

const setCookie = (data) => {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    var expires = "expires=" + d.toUTCString();
    document.cookie = data[0] + "=" + data[1] + ";" + expires + ";path=/";
};

const getCookie = (cname) => {
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
};

const seurityRoutes = (params) => {
    function isBase64(str) {
        if (str === "" || str.trim() === "") {
            return false;
        }
        try {
            return btoa(atob(str)) == str;
        } catch (err) {
            return false;
        }
    }
    if (!isBase64(params?.key) || params?.id !== atob(params?.key))
        window.location.href = "/404";
};

const baseURL = (paams) => {
    return window.location.origin;
};

const getStorage = (value) => {
    return secureLocalStorage.getItem([value]);
};

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDate = (date, time = false) => {
    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) {
        return "Invalid Date"; // or return "";
    }

    const formatString = time ? "MMMM DD, YYYY h:mm A" : "MMMM DD, YYYY";
    return parsedDate.format(formatString);
};

const formatDueDate = (date) => {
    const d = dayjs(date).startOf("day");
    const now = dayjs().startOf("day");
    const diff = d.diff(now, "day");

    if (diff === 0) {
        return "Due today";
    } else if (diff === 1) {
        return "Due tomorrow";
    } else if (diff > 1 && diff <= 7) {
        return `Due in ${diff} days`;
    } else if (diff > 7) {
        return `Due ${d.format("MMM D")}`;
    } else if (diff === -1) {
        return "Overdue by 1 day";
    } else if (diff < -1) {
        return `Overdue by ${Math.abs(diff)} days`;
    } else {
        return `Due ${d.format("MMM D")}`;
    }
};

const formatFacebookDate = (date) => {
    const d = dayjs(date);
    const now = dayjs();
    const diffInSeconds = now.diff(d, "second");
    const diffInMinutes = now.diff(d, "minute");
    const diffInHours = now.diff(d, "hour");

    if (diffInSeconds < 60) {
        return "Just now";
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
    } else if (d.isToday()) {
        return `${diffInHours} hr${diffInHours > 1 ? "s" : ""} ago`;
    } else if (d.isYesterday()) {
        return `Yesterday at ${d.format("h:mm A")}`;
    } else if (d.isSame(now, "year")) {
        return d.format("MMM D [at] h:mm A");
    } else {
        return d.format("MMM D, YYYY [at] h:mm A");
    }
};

export {
    setCookie,
    getCookie,
    delay,
    seurityRoutes,
    baseURL,
    getStorage,
    formatDate,
    formatDueDate,
    formatFacebookDate,
};
