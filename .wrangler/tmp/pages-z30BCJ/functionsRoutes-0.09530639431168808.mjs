import { onRequestGet as __api_analytics_ts_onRequestGet } from "D:\\APK\\tvstreamz\\functions\\api\\analytics.ts"
import { onRequestPost as __api_analytics_ts_onRequestPost } from "D:\\APK\\tvstreamz\\functions\\api\\analytics.ts"
import { onRequestGet as __api_auth_ts_onRequestGet } from "D:\\APK\\tvstreamz\\functions\\api\\auth.ts"
import { onRequestPost as __api_auth_ts_onRequestPost } from "D:\\APK\\tvstreamz\\functions\\api\\auth.ts"
import { onRequestDelete as __api_channels_ts_onRequestDelete } from "D:\\APK\\tvstreamz\\functions\\api\\channels.ts"
import { onRequestGet as __api_channels_ts_onRequestGet } from "D:\\APK\\tvstreamz\\functions\\api\\channels.ts"
import { onRequestPost as __api_channels_ts_onRequestPost } from "D:\\APK\\tvstreamz\\functions\\api\\channels.ts"
import { onRequestPost as __api_chat_ts_onRequestPost } from "D:\\APK\\tvstreamz\\functions\\api\\chat.ts"
import { onRequestDelete as __api_custom_channels_ts_onRequestDelete } from "D:\\APK\\tvstreamz\\functions\\api\\custom_channels.ts"
import { onRequestGet as __api_custom_channels_ts_onRequestGet } from "D:\\APK\\tvstreamz\\functions\\api\\custom_channels.ts"
import { onRequestPost as __api_custom_channels_ts_onRequestPost } from "D:\\APK\\tvstreamz\\functions\\api\\custom_channels.ts"
import { onRequestDelete as __api_messages_ts_onRequestDelete } from "D:\\APK\\tvstreamz\\functions\\api\\messages.ts"
import { onRequestGet as __api_messages_ts_onRequestGet } from "D:\\APK\\tvstreamz\\functions\\api\\messages.ts"
import { onRequestPost as __api_messages_ts_onRequestPost } from "D:\\APK\\tvstreamz\\functions\\api\\messages.ts"
import { onRequestDelete as __api_notifications_ts_onRequestDelete } from "D:\\APK\\tvstreamz\\functions\\api\\notifications.ts"
import { onRequestGet as __api_notifications_ts_onRequestGet } from "D:\\APK\\tvstreamz\\functions\\api\\notifications.ts"
import { onRequestPost as __api_notifications_ts_onRequestPost } from "D:\\APK\\tvstreamz\\functions\\api\\notifications.ts"
import { onRequestGet as __api_settings_ts_onRequestGet } from "D:\\APK\\tvstreamz\\functions\\api\\settings.ts"
import { onRequestPost as __api_settings_ts_onRequestPost } from "D:\\APK\\tvstreamz\\functions\\api\\settings.ts"
import { onRequest as __api__middleware_ts_onRequest } from "D:\\APK\\tvstreamz\\functions\\api\\_middleware.ts"

export const routes = [
    {
      routePath: "/api/analytics",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_analytics_ts_onRequestGet],
    },
  {
      routePath: "/api/analytics",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_analytics_ts_onRequestPost],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_ts_onRequestGet],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_ts_onRequestPost],
    },
  {
      routePath: "/api/channels",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_channels_ts_onRequestDelete],
    },
  {
      routePath: "/api/channels",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_channels_ts_onRequestGet],
    },
  {
      routePath: "/api/channels",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_channels_ts_onRequestPost],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_ts_onRequestPost],
    },
  {
      routePath: "/api/custom_channels",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_custom_channels_ts_onRequestDelete],
    },
  {
      routePath: "/api/custom_channels",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_custom_channels_ts_onRequestGet],
    },
  {
      routePath: "/api/custom_channels",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_custom_channels_ts_onRequestPost],
    },
  {
      routePath: "/api/messages",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_messages_ts_onRequestDelete],
    },
  {
      routePath: "/api/messages",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_messages_ts_onRequestGet],
    },
  {
      routePath: "/api/messages",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_messages_ts_onRequestPost],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_notifications_ts_onRequestDelete],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_notifications_ts_onRequestGet],
    },
  {
      routePath: "/api/notifications",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_notifications_ts_onRequestPost],
    },
  {
      routePath: "/api/settings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_settings_ts_onRequestGet],
    },
  {
      routePath: "/api/settings",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_settings_ts_onRequestPost],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [__api__middleware_ts_onRequest],
      modules: [],
    },
  ]