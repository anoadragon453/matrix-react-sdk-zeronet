/*
Copyright 2017 - 2019, 2021 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { ReactElement, useState } from "react";
import classNames from "classnames";
import { Room } from "matrix-js-sdk/src/models/room";
import { RoomMember } from "matrix-js-sdk/src/matrix";

import { MatrixClientPeg } from "../../../MatrixClientPeg";
import MatrixClientContext from "../../../contexts/MatrixClientContext";
import Tooltip, { Alignment } from "../elements/Tooltip";
import { usePermalink } from "../../../hooks/usePermalink";
import RoomAvatar from "../avatars/RoomAvatar";
import MemberAvatar from "../avatars/MemberAvatar";
import { _t } from "../../../languageHandler";
import { Icon as LinkIcon } from "../../../../res/img/element-icons/room/composer/link.svg";
import { Icon as UserIcon } from "../../../../res/img/compound/user.svg";

export enum PillType {
    UserMention = "TYPE_USER_MENTION",
    RoomMention = "TYPE_ROOM_MENTION",
    AtRoomMention = "TYPE_AT_ROOM_MENTION", // '@room' mention
    EventInSameRoom = "TYPE_EVENT_IN_SAME_ROOM",
    EventInOtherRoom = "TYPE_EVENT_IN_OTHER_ROOM",
}

export const pillRoomNotifPos = (text: string | null): number => {
    return text?.indexOf("@room") ?? -1;
};

export const pillRoomNotifLen = (): number => {
    return "@room".length;
};

const linkIcon = <LinkIcon className="mx_Pill_LinkIcon mx_BaseAvatar mx_BaseAvatar_image" />;

const PillRoomAvatar: React.FC<{
    shouldShowPillAvatar: boolean;
    room: Room | null;
}> = ({ shouldShowPillAvatar, room }) => {
    if (!shouldShowPillAvatar) {
        return null;
    }

    if (room) {
        return <RoomAvatar room={room} width={16} height={16} aria-hidden="true" />;
    }
    return linkIcon;
};

const PillMemberAvatar: React.FC<{
    shouldShowPillAvatar: boolean;
    member: RoomMember | null;
}> = ({ shouldShowPillAvatar, member }) => {
    if (!shouldShowPillAvatar) {
        return null;
    }

    if (member) {
        return <MemberAvatar member={member} width={16} height={16} aria-hidden="true" hideTitle />;
    }
    return <UserIcon className="mx_Pill_UserIcon mx_BaseAvatar mx_BaseAvatar_image" />;
};

export interface PillProps {
    // The Type of this Pill. If url is given, this is auto-detected.
    type?: PillType;
    // The URL to pillify (no validation is done)
    url?: string;
    /** Whether the pill is in a message. It will act as a link then. */
    inMessage?: boolean;
    // The room in which this pill is being rendered
    room?: Room;
    // Whether to include an avatar in the pill
    shouldShowPillAvatar?: boolean;
}

export const Pill: React.FC<PillProps> = ({ type: propType, url, inMessage, room, shouldShowPillAvatar = true }) => {
    const [hover, setHover] = useState(false);
    const { event, member, onClick, resourceId, targetRoom, text, type } = usePermalink({
        room,
        type: propType,
        url,
    });

    if (!type || !text) {
        return null;
    }

    const classes = classNames("mx_Pill", {
        mx_AtRoomPill: type === PillType.AtRoomMention,
        mx_RoomPill: type === PillType.RoomMention,
        mx_SpacePill: type === "space",
        mx_UserPill: type === PillType.UserMention,
        mx_UserPill_me: resourceId === MatrixClientPeg.get().getUserId(),
        mx_EventPill: type === PillType.EventInOtherRoom || type === PillType.EventInSameRoom,
    });

    const onMouseOver = (): void => {
        setHover(true);
    };

    const onMouseLeave = (): void => {
        setHover(false);
    };

    const tip = hover && resourceId ? <Tooltip label={resourceId} alignment={Alignment.Right} /> : null;
    let avatar: ReactElement | null = null;
    let pillText: string | null = text;
    let leadsToElement: ReactElement | null = null;

    switch (type) {
        case PillType.EventInOtherRoom:
            {
                avatar = <PillRoomAvatar shouldShowPillAvatar={shouldShowPillAvatar} room={targetRoom} />;
                pillText = text;
                // TODO: Make this a file.
                leadsToElement = <svg aria-label="Message" aria-hidden="false" role="img" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path fill="currentColor" d="M4.79805 3C3.80445 3 2.99805 3.8055 2.99805 4.8V15.6C2.99805 16.5936 3.80445 17.4 4.79805 17.4H7.49805V21L11.098 17.4H19.198C20.1925 17.4 20.998 16.5936 20.998 15.6V4.8C20.998 3.8055 20.1925 3 19.198 3H4.79805Z"></path>
                    </svg>;
            }
            break;
        case PillType.EventInSameRoom:
            {
                if (event) {
                    avatar = <PillMemberAvatar shouldShowPillAvatar={shouldShowPillAvatar} member={member} />;
                    pillText = _t("Message from %(user)s", {
                        user: text,
                    });
                } else {
                    avatar = linkIcon;
                    pillText = _t("Message");
                }
            }
            break;
        case PillType.AtRoomMention:
        case PillType.RoomMention:
        case "space":
            avatar = <PillRoomAvatar shouldShowPillAvatar={shouldShowPillAvatar} room={targetRoom} />;
            break;
        case PillType.UserMention:
            avatar = <PillMemberAvatar shouldShowPillAvatar={shouldShowPillAvatar} member={member} />;
            break;
        default:
            return null;
    }

    let rightChevron: ReactElement | null = null;
    if (leadsToElement) {
        // Render a right-pointing chevron leading towards the given element.
        rightChevron = <span className="mx_Pill_ChevronRight"></span>;
    }

    return (
        <bdi>
            <MatrixClientContext.Provider value={MatrixClientPeg.get()}>
                {inMessage && url ? (
                    <a
                        className={classes}
                        href={url}
                        onClick={onClick}
                        onMouseOver={onMouseOver}
                        onMouseLeave={onMouseLeave}
                    >
                        {avatar}
                        <span className="mx_Pill_text">{pillText}</span>
                        {rightChevron}
                        {leadsToElement}
                        {tip}
                    </a>
                ) : (
                    <span className={classes} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
                        {avatar}
                        <span className="mx_Pill_text">{pillText}</span>
                        {tip}
                    </span>
                )}
            </MatrixClientContext.Provider>
        </bdi>
    );
};
