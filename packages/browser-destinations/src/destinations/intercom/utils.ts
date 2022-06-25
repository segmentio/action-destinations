import dayjs from "dayjs";

//convert from ISO to Unix
export function convertISOtoUnix(date: string){
    return dayjs(date).unix()
}