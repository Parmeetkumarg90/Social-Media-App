"use client";
import Image from 'next/image';
import { useState } from 'react';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Button from "@mui/material/Button";
import style from "./style.module.css";

const Carousal = ({ list, status, isVisible }: { list: string[], status?: string, isVisible: boolean }) => {
    const [index, setIndex] = useState<number>(0);

    const nextCorrectIndex = () => {
        const isTurn = (index + 1) % list.length;
        return isTurn;
    }

    const previousCorrectIndex = () => {
        const isTurn = index - 1;
        return isTurn < 0 ? list.length - 1 : isTurn;
    }

    return (
        <>
            {
                list.length > 0 &&
                <div className={`${style.card}`}>
                    {!isVisible ?
                        <>
                            {status === "Deleted" && <div>Post has been deleted by the user.</div>}
                            {status === "Post privated" && <div>Post has been privated by the user.</div>}
                            {status === "Profile privated" && <div>Profile has been privated by the user.</div>}
                        </>
                        :
                        <>
                            {
                                list.length > 1 &&
                                <Button onClick={() => { setIndex(previousCorrectIndex()); }} className={`${style.arrow} ${style.absolute} ${style.leftArrow} ${style.blackColor} ${style.button}`}>
                                    <KeyboardArrowLeftIcon fontSize='large' titleAccess='Previous' />
                                </Button>
                            }
                            < Image src={list[index] ?? "/broken-image.png"} fill alt={list[index] ?? "/broken-image.png"} key={index} />
                            {
                                list.length > 1 &&
                                <Button onClick={() => { setIndex(nextCorrectIndex()); }} className={`${style.arrow} ${style.absolute} ${style.rightArrow} ${style.blackColor} ${style.button}`}>
                                    <KeyboardArrowRightIcon fontSize='large' titleAccess='Next' />
                                </Button>
                            }
                        </>
                    }
                </div >
            }
        </>
    );
}

export default Carousal;