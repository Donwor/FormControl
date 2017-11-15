import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/do";
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable } from "rxjs/Observable";
import { Action } from "@ngrx/store";
import { Actions, Effect } from "@ngrx/effects";
import { of } from "rxjs/observable/of";

import * as UserActions from "./user.actions";
import * as Encript from "./../../state/user/sha2";
import { log } from "util";
export type Action = UserActions.All;

@Injectable()
export class UserEffects {
  LoginRequest: Function;
  EncodeLogin: Function;

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private router: Router
  ) {
    this.LoginRequest = (username, password) => {
      const encPass = Encript.b64_sha512(password) + "==";

      return {
        ServerRequest: "LoginRequest",
        RequestData: {
          LoginUser: username,
          LoginHashPassword: encPass,
          LoginPassword: null,
          LoginIIS: false
        },
        RequestSession: null
      };
    };

    this.EncodeLogin = req => {
      console.log(req, JSON.stringify(req));

      const encodedurl = "ajax_req=" + encodeURIComponent(JSON.stringify(req));
      console.log(encodedurl);

      return encodedurl;
    };
  }

  @Effect()
  login$: Observable<Action> = this.actions$
    .ofType(UserActions.USER_LOG_IN)
    .mergeMap(action =>
      // [ Hack ] should typeckeck `payload`
      this.http
        .post(
          "http://192.168.50.100/PassWeb/AxonHandler.ashx",
          this.EncodeLogin(
            this.LoginRequest(
              action["payload"].username,
              action["payload"].password
            )
          ),
          {
            headers: new HttpHeaders().set(
              "Content-Type",
              "application/x-www-form-urlencoded"
            ),
            responseType: "text"
          }
        )
        .map(data => JSON.parse(data.replace("--------------", ""))) // transform to json
        .do(data => console.log("data", data))
        // .do(data => this.router.navigate(['home']))
        .map(data => ({
          type: UserActions.USER_LOG_IN_SUCCESS,
          payload: {
            username: action["payload"].username,
            password: action["payload"].password
          }
        }))
        .catch(err => of({ type: UserActions.USER_LOG_IN_FAIL, payload: err }))
    );
}
