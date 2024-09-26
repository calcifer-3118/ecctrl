import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef, Suspense, useState } from "react";
import * as THREE from "three";
import { useGame, type AnimationSet } from "./stores/useGame";
import React from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function EcctrlAnimation(props: EcctrlAnimationProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(props.characterURL);
  const [animationsAdded, setAnimationsAdded] = useState(false);

  useEffect(() => {
    const loader = new GLTFLoader();

    const loadModelAndAnimations = async () => {
      try {
        for (const animUrl of props.animationUrls) {
          const animData = await loader.loadAsync(animUrl);
          animData.animations.forEach((clip) => {
            scene.animations.push(clip);
          });
        }
        setAnimationsAdded(true);
      } catch (error) {
        console.error("Error loading animations:", error);
      }
    };

    loadModelAndAnimations();
  }, [scene, props.animationUrls]);

  const { actions, mixer } = useAnimations(
    animationsAdded ? scene.animations : [],
    group
  );

  const curAnimation = useGame((state) => state.curAnimation);
  const resetAnimation = useGame((state) => state.reset);
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    initializeAnimationSet(props.animationSet);
  }, [props.animationSet, initializeAnimationSet]);

  useEffect(() => {
    if (actions && animationsAdded && group.current) {
      const action =
        actions[curAnimation] || actions[props.animationSet.jumpIdle];

      if (
        curAnimation === props.animationSet.jump ||
        curAnimation === props.animationSet.jumpLand ||
        curAnimation === props.animationSet.action1 ||
        curAnimation === props.animationSet.action2 ||
        curAnimation === props.animationSet.action3 ||
        curAnimation === props.animationSet.action4
      ) {
        action
          .reset()
          .fadeIn(0.2)
          .setLoop(THREE.LoopOnce, undefined as number)
          .play();
        action.clampWhenFinished = true;
      } else {
        action.reset().fadeIn(0.2).play();
      }

      (action as any)._mixer.addEventListener("finished", () => resetAnimation());

      return () => {
        action.fadeOut(0.2);
        (action as any)._mixer.removeEventListener("finished", () =>
          resetAnimation()
        );
      };
    }
  }, [curAnimation, actions, animationsAdded]);

  return (
    <Suspense fallback={null}>
      <group ref={group} dispose={null} userData={{ camExcludeCollision: true }}>
        {props.children}
      </group>
    </Suspense>
  );
}

export type EcctrlAnimationProps = {
  characterURL: string;
  animationUrls: string[];
  animationSet: AnimationSet;
  children: React.ReactNode;
};
