"use client";
import Card from "@mui/material/Card";
import style from "./style.module.css";
import ChatNav from "@/components/chat/navbar/chat-nav";
import ChatInput from "@/components/chat/input/char-input";
import ChatList from "@/components/chat/chat-list/list";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hook";
import { RootState } from "@/redux/store";
import { CircularProgress } from "@mui/material";
import { userInterface } from "@/interfaces/user/user";
import { and, collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { firestoreDb } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { chatInputInterface, chatStatusInterface } from "@/interfaces/chat/chat";

const SpecificChat = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [receiverDetail, setReceiverDetail] = useState<userInterface | null>(null);
  const [allMessage, setMessages] = useState<chatInputInterface[]>([]);
  const [senderMessage, setSenderMessages] = useState<chatInputInterface[]>([]);
  const [receiverMessage, setReceiverMessages] = useState<chatInputInterface[]>([]);
  const [isTyping, setTyping] = useState<boolean>(false);

  useEffect(() => {
    getReceiverDetail();
  }, []);

  useEffect(() => {
    if (!receiverDetail) {
      return;
    }

    const unsubscribeSent = onSnapshot(query(collection(firestoreDb, "chats"), and(where("senderId", "==", loggedInUser.id), where("receiverId", "==", receiverDetail.id)), orderBy("time")), result => {
      const sentMessages: chatInputInterface[] = snapShotToData(result);
      const allResult: chatInputInterface[] = unqiueListMaker([...senderMessage, ...sentMessages]);
      setSenderMessages(allResult);
    });

    const unsubscribeReceived = onSnapshot(query(collection(firestoreDb, "chats"), and(where("receiverId", "==", loggedInUser.id), where("senderId", "==", receiverDetail.id)), orderBy("time")), result => {
      const receivedMessages: chatInputInterface[] = snapShotToData(result);
      const allResult: chatInputInterface[] = unqiueListMaker([...receiverMessage, ...receivedMessages]);
      setReceiverMessages(allResult);
    });

    const unsubscribeTyping = onSnapshot(query(collection(firestoreDb, "typingStatus"), and(where("receiverId", "==", loggedInUser.id), where("senderId", "==", receiverDetail.id))), result => {
      if (!result.empty) {
        const allDoc = result.docs[0].data();
        const typingStatusObj: chatStatusInterface = {
          senderId: allDoc.senderId,
          receiverId: allDoc.receiverId,
          isSenderTyping: allDoc.isSenderTyping,
          isReceiverTyping: allDoc.isReceiverTyping
        }
        if (typingStatusObj.senderId === receiverDetail.id) {
          setTyping(typingStatusObj.isSenderTyping);
        }
      }
    });

    return () => {
      if (receiverDetail) {
        unsubscribeReceived();
        unsubscribeSent();
        unsubscribeTyping();
      }
    }
  }, [receiverDetail]);

  useEffect(() => {
    setMessages([...senderMessage, ...receiverMessage].sort((a, b) => a.time - b.time));
  }, [senderMessage, receiverMessage]);

  const getReceiverDetail = async () => {
    try {
      const { id } = await params;
      const docRef = doc(firestoreDb, "users", id);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        const docDetail = docSnapshot.data();
        const receiverDetail: userInterface = {
          email: docDetail.email,
          photoURL: docDetail.photoURL,
          displayName: docDetail.displayName,
          uid: docDetail.uid,
          id: docSnapshot.id,
          isOnline: docDetail.isOnline,
        };
        setReceiverDetail(receiverDetail);
      }
      else {
        enqueueSnackbar("Invalid Profile for chat");
        router.push('/chat');
      }
    }
    catch (e) {
      console.log("Error in finding user id: ", e);
    }
    finally {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        setLoading(false);
      }, 800);
    }
  }

  const unqiueListMaker = (list: chatInputInterface[]) => {
    return list.filter((message, index, self) => index === self.findIndex(each =>
      each.time === message.time &&
      each.text === message.text &&
      each.senderId === message.senderId &&
      each.receiverId === message.receiverId
    ));
  }

  const snapShotToData = (snapshot: any) => {
    const messages: chatInputInterface[] = [];
    const snapshotRef = snapshot.docs;
    snapshotRef.forEach((doc: any) => {
      const data = doc.data();
      messages.push({
        senderId: data.senderId,
        receiverId: data.receiverId,
        text: data.text,
        time: data.time,
      });
    });
    return messages;
  }

  return (
    <Card className={`${style.grid}`}>
      {
        isLoading ? <CircularProgress size={"3rem"} title="Loading chat area" /> :
          <>
            <ChatNav senderId={loggedInUser.id!} receiverDetail={receiverDetail!} />
            <ChatList senderId={loggedInUser.id!} receiverDetail={receiverDetail!} allMessage={allMessage} isTyping={isTyping} />
            <ChatInput senderId={loggedInUser.id!} receiverDetail={receiverDetail!} />
          </>
      }
    </Card>
  )
}

export default SpecificChat;