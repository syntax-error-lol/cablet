import { useState } from "react";
import { Navigate } from "react-router-dom";
import Turnstile from "react-turnstile";
import { useLoading } from "@stores/LoadingStore";
import { useUser } from "@stores/UserStore";
import { useLogin } from "@controllers/auth/useLogin/index";
import { useRegister } from "@controllers/auth/useRegister/index";
import { Button, ErrorContainer, Input, Toggle } from "@components/index";
import styles from "./authentication.module.scss";

import { AuthenticationType, AuthenticationProps } from "./authentication.d";

function calculateWater() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;

    const baseAspectRatio = 1.875;
    const baseTranslateY = -67;
    const baseRotateX = 80;
    const baseHeight = 100;

    let translateY = baseTranslateY;
    let adjustedHeight = baseHeight;

    if (aspectRatio > baseAspectRatio) {
        const widthFactor = (aspectRatio - baseAspectRatio) / baseAspectRatio;

        translateY = baseTranslateY - (widthFactor * 33);
        adjustedHeight = baseHeight + (widthFactor * 800);
    }

    let rotateX = baseRotateX;

    if (height < 768) {
        const heightFactor = (768 - height) / 768;
        rotateX = baseRotateX - (heightFactor * 5);
        adjustedHeight = adjustedHeight + (heightFactor * 25);
    }

    if (height > 1080) {
        const tallFactor = (height - 1080) / 1080;
        adjustedHeight = adjustedHeight + (tallFactor * 20);
    }

    translateY = Math.max(-120, Math.min(-50, translateY));
    rotateX = Math.max(70, Math.min(85, rotateX));

    const cssHeight = Math.max(0, (adjustedHeight - 100) / 5);

    return {
        transform: `translate(-50%, ${translateY}%) perspective(50vh) rotateX(${rotateX}deg)`,
        height: `${100 + cssHeight}%`
    };
}

export default function Authentication({ type }: AuthenticationProps) {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [checked, setChecked] = useState<boolean>(false);
    const [otpRequired, setOtpRequired] = useState<boolean>(false);
    const [otpCode, setOtpCode] = useState<string>("");
    const [captchaToken, setCaptchaToken] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [tries, setTries] = useState<number>(0);

    const { setLoading } = useLoading();
    const { user } = useUser();

    const { login } = useLogin();
    const { register } = useRegister();

    if (user) return <Navigate to="/dashboard" />;

    const submitForm = async () => {
        if (username === "") return setError("Where's the username?");
        if (password === "") return setError("Where's the password?");

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) return setError("Username can only contain letters, numbers, underscores, and dashes.");

        if (type === AuthenticationType.LOGIN) {
            setLoading("Logging in");
            login({ username, password, otpCode: (otpRequired ? otpCode : undefined), captchaToken })
                .then(() => {
                    setLoading("Reloading");
                    window.location.reload();
                })
                .catch((err) => {
                    setTries((prev) => prev + 1);

                    if (err.status === 401) return setOtpRequired(true), setLoading(false);

                    if (err?.data?.message) setError(err.data.message);
                    else setError("Something went wrong.");

                    setLoading(false);
                });
        } else if (type === AuthenticationType.REGISTER) {
            if (!checked) return setError("You must agree to our Privacy Policy and Terms of Service.");

            setLoading("Registering");
            register({ username, password, captchaToken })
                .then(() => {
                    setLoading("Reloading");
                    window.location.reload();
                })
                .catch((err) => {
                    setTries((prev) => prev + 1);

                    if (err?.data?.message) setError(err.data.message);
                    else setError("Something went wrong.");

                    setLoading(false);
                });
        }
    };

    const water = calculateWater();

    return (
        <>
            <div className={styles.background} style={{
                // backgroundImage: `url('${window.constructCDNUrl("/content/auth-background.png")}')`
                backgroundImage: "url('https://files.catbox.moe/kkigs1.webp')"
            }} />

            <div className={styles.water} style={{
                backgroundImage: `url('${window.constructCDNUrl("/content/trading-plaza/water.gif")}')`,
                transform: water.transform,
                height: water.height
            }} />

            <div className={styles.container}>
                <div className={styles.leftSide}>
                    <form className={`${styles.inside} ${styles.glass}`}>
                        <div className={styles.header}>
                            {type === AuthenticationType.LOGIN ? "Login" : "Register"}
                        </div>

                        <Input
                            icon="fas fa-user"
                            placeholder="Username"
                            type="text"
                            autoComplete="username"
                            maxLength={16}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setOtpRequired(false);
                                setOtpCode("");
                                setError("");
                            }}
                            className={styles.input}
                        />

                        <Input
                            icon="fas fa-lock"
                            placeholder="Password"
                            type="password"
                            autoComplete="password"
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError("");
                            }}
                            className={styles.input}
                        />

                        {otpRequired && (
                            <Input
                                icon="fas fa-key"
                                placeholder="OTP / 2FA Code"
                                type="text"
                                autoComplete="off"
                                onChange={(e) => {
                                    setOtpCode(e.target.value);
                                    setError("");
                                }}
                                className={styles.input}
                            />
                        )}

                        {type === AuthenticationType.REGISTER && <>
                            <div className={styles.agreeHolder}>
                                <Toggle
                                    checked={checked}
                                    onClick={() => {
                                        setChecked(!checked);
                                        setError("");
                                    }}>
                                    <div className={styles.agreeText}>
                                        I agree to the <a href="/terms" target="_blank">Terms of Service</a>, I am over the age of 13,
                                        and I hold no liability or harm to the creators of this website.
                                    </div>
                                </Toggle>
                            </div>
                        </>}

                        <Turnstile
                            key={tries}
                            sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                            onVerify={setCaptchaToken}
                            theme="light"
                        />

                        <Button.ClearButton style={{ marginTop: 10, fontSize: 25, padding: "5px 20px" }} onClick={submitForm}>
                            {type === AuthenticationType.LOGIN ? "Login" : "Register"}
                        </Button.ClearButton>

                        {error && <ErrorContainer style={{ marginTop: 15, marginBottom: 0 }}>{error}</ErrorContainer>}
                    </form>
                </div>

                {/* <div className={styles.rightSide}>
                    <img src={window.constructCDNUrl("/content/yapbot.png")} className={styles.rightImage} />

                    <div className={styles.rightText}>

                    </div>
                </div> */}
            </div>

            <svg style={{ display: "none" }}>
                <filter id="displacementFilter">
                    <feTurbulence
                        type="turbulence"
                        baseFrequency={0.01}
                        numOctaves={2}
                        result="turbulence"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="turbulence"
                        scale={50}
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </svg>
        </>
    );
}
