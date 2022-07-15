import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../../firebase";

export function getCommentsByCamperId(camperid) {
  const q = query(
    collection(db, "comments2"),
    where("camperId", "==", camperid),
    orderBy("createdAt", "desc")
  );
  return getDocs(q)
    .then((querySnapshot) => {
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    })
    .then((data) => {
      return data;
    })
    .catch((er) => console.log(er));
}
