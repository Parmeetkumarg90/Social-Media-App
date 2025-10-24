"use client";
import { userInterface } from '@/interfaces/user/user';
import style from "./style.module.css";
import Image from 'next/image';
import { Card } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { useRouter } from 'next/navigation';

const ChatNav = ({ receiverDetail, senderId }: { receiverDetail: userInterface, senderId: string }) => {
    const router = useRouter();

    return (
        <Card className={`${style.card} ${style.grid} ${style.border}`}>
            <KeyboardArrowLeftIcon fontSize='large' onClick={() => { router.push("/chat"); }} className={`${style.pointer}`} />
            <div className={` ${style.relative} ${style.pointer}`} onClick={() => { router.push(`/profile/${receiverDetail.uid}`) }}>
                <Image src={receiverDetail.photoURL ?? "/blank-profile-picture.svg"} fill alt={receiverDetail.photoURL ?? "blank-profile-picture.svg"} className={`${style.rounded_logo} ${style.relative}`} />
            </div>
            <div>
                <p className={`${style.boldText}`}>{receiverDetail.displayName ?? "Username"}</p>
                <p>
                    Status: <span className={`${receiverDetail.isOnline ? style.textGreen : style.textRed}`}>
                        {receiverDetail.isOnline ? "Online" : "Offline"}
                    </span>
                </p>
            </div>
        </Card>
    )
}

export default ChatNav;